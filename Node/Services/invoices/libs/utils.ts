import { GetInvoicesDTO } from "../dto/get-invoices";
import {MoreThanOrEqual, MoreThan, LessThanOrEqual, Raw, SelectQueryBuilder} from "typeorm";
import { GetInvoiceDTO } from "../dto/get-invoice";
import { Invoice } from "../../common/entities/invoice";
import {INVOICE_APPROVAL_STATUS, INVOICE_VERIFICATION_STATUS, INVOICE_ALGORITHM_STATUS, INVOICE_SETTLEMENT_STATUS} from "./constants";
//import {FindManyOptions} from "typeorm";

export const getInvoiceListWhere = (dto:GetInvoicesDTO) => {
    const common = {
        isDeleted: false,
        ...( dto.status ? { status: dto.status } : {}),
        // ...( dto.date_start ? { dueDate: MoreThan(new Date(dto.date_start).getTime())} : {}),
        //...( dto.date_start ? { dueDate: MoreThan('2021-02-25 10:00:00.000')} : {}),
        // ...( dto.date_start ? { dueDate: Raw(alias =>`${alias} >= ':date_start'`, {date_start: dto.date_start})} : {}),
        ...( dto.date_end ? { dueDate: LessThanOrEqual(dto.date_end)} : {}),
        ...( dto.payer_id && !dto.user_corporate_id ? { payer: { id: dto.payer_id}} : {}),
        ...( dto.payee_id && !dto.user_corporate_id ? { payee: { id: dto.payee_id}} : {}),
    }

    const other_corporate_as_payer = {
        payer: { id: dto.corporate_id}
    }

    const other_corporate_as_payee = {
        payee: { id: dto.corporate_id}
    }

    const user_corporate_as_payer = {
        payer: { id: dto.user_corporate_id}
    }

    const user_corporate_as_payee = {
        payee: { id: dto.user_corporate_id}
    }

    if (dto.user_corporate_id) {
        // For corporate admin user (belongs to a corporate)

        if (dto.corporate_id && !dto.type) {
            // filter by other corporate id too
            return {
                where: [{
                    ...common,
                    ...user_corporate_as_payee,
                    ...other_corporate_as_payer
                }, {
                    ...common,
                    ...user_corporate_as_payer,
                    ...other_corporate_as_payee
                }]
            }
        }

        if (!dto.corporate_id && dto.type && dto.type === 'payable') {
            return {
                ...common,
                ...user_corporate_as_payer,
            }
        }

        if (!dto.corporate_id && dto.type && dto.type === 'receivable') {
            return {
                ...common,
                ...user_corporate_as_payee,
            }
        }

        if (dto.corporate_id && dto.type && dto.type === 'payable') {
            return {
                ...common,
                ...user_corporate_as_payer,
                ...other_corporate_as_payee
            }
        }
        if (dto.corporate_id && dto.type && dto.type === 'receivable') {
            return {
                ...common,
                ...user_corporate_as_payee,
                ...other_corporate_as_payer
            }
        }
        // Default filter by user corporate id (payee or payer)
        // no explicit filters, filter just by current user's corporate and common filters, like isDeleted: false
        return {
            where: [{
                ...common,
                ...user_corporate_as_payee,
            }, {
                ...common,
                ...user_corporate_as_payer,

            }]
        }
    } else {
        // For sawi exchange admin user (does not belong to a corporate)
        // Filtering by type is ignored for sawi exchange admin

        if (dto.corporate_id) {
            // filter by other corporate id too
            return {
                where: [{
                    ...common,
                    ...other_corporate_as_payer
                }, {
                    ...common,
                    ...other_corporate_as_payee
                }]
            }
        }

        // Default filter just by common conditions
        return common;
    }
}

const relByType = {
    'payable': 'payer',
    'receivable': 'payee'
};

const otherByType = {
    'payable': 'payee',
    'receivable': 'payer'
};

const statusFilter = (status: string) => {
    const algValues = Object.values(INVOICE_ALGORITHM_STATUS) as string[];
    const settleValues = Object.values(INVOICE_SETTLEMENT_STATUS) as string[];
    if (algValues.includes(status)) {
        return {
            algStatus: status
        }
    }
    if (settleValues.includes(status)) {
        return {
            settlementStatus: status
        }
    }

    return {};
}

export const configureInvoiceListQueryBuilderWhere = (dto:GetInvoicesDTO, qb: SelectQueryBuilder<Invoice>) => {
    const common = {
        isDeleted: false,
        // ...( dto.status ? { status: dto.status } : {}),
        ...( dto.status ? statusFilter(dto.status) : {}),
        ...( dto.payer_id && !dto.user_corporate_id ? { payer: { id: dto.payer_id}} : {}),
        ...( dto.payee_id && !dto.user_corporate_id ? { payee: { id: dto.payee_id}} : {}),
    }

    qb.where({...common});

    if (dto.date_start) {
        qb.andWhere(
            `invoice.due_date >= :date_start`,
            {
                date_start: dto.date_start
            }
        )
    }

    if (dto.date_end) {
        qb.andWhere(
            `invoice.due_date <= :date_end`,
            {
                date_end: dto.date_end
            }
        )
    }

    if (dto.av_date_start || dto.av_date_end) {
        qb.andWhere('invoice.verification_date is not null AND invoice.approval_date is not null');
    }

    if (dto.av_date_start) {
        qb.andWhere(`
        GREATEST(invoice.verification_date, invoice.approval_date) >= :date
        `, {date: dto.av_date_start})
    }

    if (dto.av_date_end) {
        qb.andWhere(`
        GREATEST(invoice.verification_date, invoice.approval_date) <= :date
        `, {date: dto.av_date_end})
    }

    if (dto.rejection_date_start) {
        qb.andWhere(
            `invoice.rejection_date >= :date_start`,
            {
                date_start: dto.rejection_date_start
            }
        )
    }

    if (dto.rejection_date_end) {
        qb.andWhere(
            `invoice.rejection_date <= :date_end`,
            {
                date_end: dto.rejection_date_end
            }
        )
    }

    if (dto.av_status) {
        switch (dto.av_status) {
            case 'pending':
                qb.andWhere(`(invoice.approval_status = '${INVOICE_APPROVAL_STATUS.PENDING}' OR invoice.verification_status = '${INVOICE_VERIFICATION_STATUS.PENDING}')`);
                qb.andWhere(`invoice.approval_status != '${INVOICE_APPROVAL_STATUS.REJECTED}' AND invoice.verification_status != '${INVOICE_VERIFICATION_STATUS.REJECTED}'`);
                break;
            case 'verified':
                qb.andWhere(`invoice.approval_status = '${INVOICE_APPROVAL_STATUS.APPROVED}' AND invoice.verification_status = '${INVOICE_VERIFICATION_STATUS.VERIFIED}'`);
                break;
            case 'rejected':
                qb.andWhere(`(invoice.approval_status = '${INVOICE_APPROVAL_STATUS.REJECTED}' OR invoice.verification_status = '${INVOICE_VERIFICATION_STATUS.REJECTED}')`);
                break;
        }
    }


    if (dto.user_corporate_id) {
        // Some filter params make sense only for corporate user
        // type ['payable', 'receivable'], corporate

        if (!dto.corporate_id && !dto.type) {
            qb.andWhere(
                `(invoice.payer_id = :u_id OR invoice.payee_id = :u_id)`, {
                    u_id: dto.user_corporate_id
                }
            );
        }

        if (dto.corporate_id && !dto.type) {
            qb.andWhere(
                `((invoice.payer_id = :u_id AND invoice.payee_id = :c_id) OR (invoice.payee_id = :u_id AND invoice.payer_id = :c_id))`, {
                    u_id: dto.user_corporate_id,
                    c_id: dto.corporate_id,
                }
            );
        }
        if (!dto.corporate_id && dto.type) {
            qb.andWhere(
                // @ts-ignore
                `invoice.${relByType[dto.type]}_id = :u_id`, {
                    u_id: dto.user_corporate_id
                }
            )
        }

        if (dto.corporate_id && dto.type) {
            qb.andWhere(
                // @ts-ignore
                `invoice.${relByType[dto.type]}_id = :u_id AND invoice.${otherByType[dto.type]}_id = :c_id`, {
                    u_id: dto.user_corporate_id,
                    c_id: dto.corporate_id,
                }
            )

        }
    } else {
        // Sawi admin filters
        // We now DO support type and corporate for sawi admin
        if (dto.corporate_id && !dto.type) {
            qb.andWhere(
                `(invoice.payer_id = :c_id OR invoice.payee_id = :c_id)`, {
                    c_id: dto.corporate_id
                }
            );
        }

        if (dto.corporate_id && dto.type) {
            qb.andWhere(
                // @ts-ignore
                `invoice.${relByType[dto.type]}_id = :c_id`, {
                    c_id: dto.corporate_id,
                }
            )

        }
    }
}
