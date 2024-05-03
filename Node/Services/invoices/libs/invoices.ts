import {Invoice} from "../../common/entities/invoice";
import {Corporate} from "../../common/entities/corporate";
import {CreateInvoiceDTO} from "../dto/create-invoice";
import {UpdateInvoiceDTO} from "../dto/update-invoice";
import {getConnection} from '../../common/database';
import {NotFoundError, PreconditionError, ValidationError} from "../../common/error-handler";
import {DeleteInvoiceDTO} from "../dto/delete-invoice";
import {GetInvoiceDTO} from "../dto/get-invoice";
import {GetInvoicesDTO} from "../dto/get-invoices";
import {configureInvoiceListQueryBuilderWhere} from "./utils";
import {INVOICE_ORIGIN, INVOICE_SETTLEMENT_STATUS} from "./constants";
import {recalculateForInvoice} from "../../balances/libs/balances";
import {createNotification} from "../../notifications/libs/notification";
import {NotificationTargetType, NotificationType} from "../../common/constants/notification";

export const createInvoice = async (dto: CreateInvoiceDTO) => {
    // Additional validations
    if (dto.payerId === dto.payeeId) {
        throw new ValidationError('Payer and Payee can not be the same', {...dto, payerId: null, payeeId: null});
    }

    const connection = await getConnection();
    return await connection.transaction( async manager => {
        const invoiceRepository = manager.getRepository(Invoice);
        const corporateRepository = manager.getRepository(Corporate);

        // Verify payer and payee corporates exist
        const corporates = await corporateRepository.findByIds([ dto.payerId, dto.payeeId], {isDeleted: false});

        if (!corporates || corporates.length !== 2) {
            throw new ValidationError('Payer or Payee (or both) does not exist', {...dto, payerId: null, payeeId: null});
        }

        const corporate = await corporateRepository.findOne({id: dto.corporateId, isDeleted: false});
        
        const payer = corporates.find( c => c.id === dto.payerId);
        const payee = corporates.find( c => c.id === dto.payeeId);

        // Create invoice
        const invoice = invoiceRepository.create({
            corporate,
            externalId: dto.externalId,
            payee,
            payer,
            addedBy: {id: dto.addedBy},
            status: 'new',
            amount: dto.amount,
            remainingAmount: dto.amount,
            currencyCode: dto.currencyCode || 'USD',
            earlyPaymentStatus: !!dto.earlyPaymentStatus,
            earlyPaymentDiscountPercent: dto.earlyPaymentDiscountPercent || null,
            earlyPaymentDueDate: dto.earlyPaymentDueDate || null,
            issueDate: dto.issueDate,
            dueDate: dto.dueDate,
            origin: dto.origin
        });

        const res = await invoiceRepository.save(invoice);

        if (dto.origin !== INVOICE_ORIGIN.BULK_UPLOAD) {
            await createNotification({
                type: NotificationType.INVOICE_CREATED_BY_ADMIN,
                targetType: NotificationTargetType.CORPORATE,
                targetId: payee.id,
                linkedEntities: [
                    {
                        entity: invoice,
                        label: 'invoice',
                        type: 'invoice'
                    }
                ]
            });
        }

        return res;
    })
}

export const deleteInvoice = async (dto: DeleteInvoiceDTO) => {
    const connection = await getConnection();
    return await connection.transaction( async manager => {
        const invoiceRepository = manager.getRepository(Invoice);
        const invoice = await invoiceRepository.findOne({id: dto.id, isDeleted: false});

        if (!invoice) {
            throw new NotFoundError('Invoice not found');
        }

        // @ts-ignore
        if ([INVOICE_SETTLEMENT_STATUS.FULLY_SETTLED, INVOICE_SETTLEMENT_STATUS.PARTIALLY_SETTLED].includes(invoice.settlementStatus)) {
            throw new PreconditionError('Invoices in statuses Settled or Partially settled cannot be deleted.');
        }

        invoice.isDeleted = true;

        await invoiceRepository.save(invoice);

        // update balances
        // "manager as any" this is because TS doesn't connect types defined in different npm modules
        // in reality type of "manager" here and in func signature is the same
        // but from different node_modules. which typescript doesnt tolerate.
        await recalculateForInvoice(manager as any, invoice);
    })
}

export const getInvoice = async (dto: GetInvoiceDTO) => {
    const connection = await getConnection();
    return await connection.transaction( async manager => {
        const invoiceRepository = manager.getRepository(Invoice);
        const invoice = await invoiceRepository.findOne({id: dto.id, isDeleted: false});

        if (!invoice) {
            throw new NotFoundError('Invoice not found');
        }

        if ([INVOICE_SETTLEMENT_STATUS.FULLY_SETTLED, INVOICE_SETTLEMENT_STATUS.PARTIALLY_SETTLED].includes(invoice.settlementStatus)) {
            // TODO extract into settlements service

            const settlementRunsRaw = await manager.query(`select sr.id "runId", sl.id "loopId" from settlement_run sr
                join settlement_loop sl on sl.run_id = sr.id
                join settlement_balance sb on sb.loop_id = sl.id
                join settlement_invoice si on si.balance_id = sb.id
                where si.invoice_id = $1`, [invoice.id]);

                const settlements = settlementRunsRaw.reduce((acc:any[], v: any) => {
                    const idx = acc.findIndex(({id}) => id === v.runId);
                    if (idx > -1) {
                        const existing = acc[idx];

                        const newAcc = [
                            ...acc.slice(0, idx),
                            {
                                ...existing,
                                loops: [
                                    ...existing.loops,
                                    {
                                        id: v.loopId
                                    }
                                ]
                            },
                            ...acc.slice(idx + 1)
                        ]
                        return newAcc;
                    } else {
                        return [
                            ...acc,
                            {
                                id: v.runId,
                                loops: [{ id: v.loopId}]
                            }
                        ]
                    }
                }, [])

            Object.assign(invoice, { settlements })
        }

        return invoice;
    })
}

export const getInvoices = async (dto: GetInvoicesDTO) => {
    const connection = await getConnection();
    return await connection.transaction( async manager => {
        const invoiceRepository = manager.getRepository(Invoice);

        const qb = invoiceRepository.createQueryBuilder('invoice')
            .leftJoinAndSelect("invoice.payer", "payer")
            .leftJoinAndSelect("invoice.payee", "payee")

        // @ts-ignore
        configureInvoiceListQueryBuilderWhere(dto, qb);

        const CUSTOM_SORTS: {[key: string]: string | undefined} = {
            'avDate': `GREATEST(invoice.verification_date, invoice.approval_date)`
        };

        return await qb.getManyAndCount();
    })
}
