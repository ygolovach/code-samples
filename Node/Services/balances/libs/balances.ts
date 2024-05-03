import {getConnection} from '../../common/database';
import {Balance} from '../../common/entities/balance';
import {BalanceInvoice} from '../../common/entities/balance-invoice';
import {Invoice} from '../../common/entities/invoice';
import {Corporate} from '../../common/entities/corporate';
import {NotFoundError} from '../../common/error-handler';
import {INVOICE_ALGORITHM_STATUS, INVOICE_APPROVAL_STATUS, INVOICE_VERIFICATION_STATUS} from '../../invoices/libs/constants';
import {GetBalanceDto, GetBalanceInvoicesDto, GetBalancesDto, UpdateBalanceDto} from '../dto';
import {CORPORATE_STATUSES} from "../../auth/libs/constants";
import {EntityManager} from "typeorm";
import { SettlementRun } from '../../common/entities/settlement-run';
import {decreaseBalanceForPayerPayee, decreaseBalanceInvoiceAmount, decreaseInvoiceAmount, getBalancesByRun, getInvoicesByBalance} from './utils';

export const calculate = async () => {
    const connection = await getConnection();
    return await connection.transaction('SERIALIZABLE', async manager => {

        // Get payer - payee pairs from invoice table (algStatus = 'new')
        // Ensure a record in balance table exists for each pair (insert)
        // Get collection of ids of invoices for each pair
        // Calculate sum of amounts of invoices in ids for each pair
        // Increase amount in balance
        // Add balanceInvoice records for invoices in ids
        // Set status to 'ready' for all invoices in ids

        // There is a need to create a new query builder as groupBy mutates inital qb
        const invQB = () => manager.getRepository(Invoice).createQueryBuilder('invoice');
        const balanceQB = () => manager.getRepository(Balance).createQueryBuilder();
        const balanceInvoiceQB = () => manager.getRepository(BalanceInvoice).createQueryBuilder();
        const corporateQB = () => manager.getRepository(Corporate).createQueryBuilder();

        const pairs = await invQB()
            .select(['invoice.payer_id', 'invoice.payee_id'])
            .where('invoice.algStatus = :algStatus', {algStatus: INVOICE_ALGORITHM_STATUS.NEW})
            .andWhere('invoice.approvalStatus = :approvalStatus', {approvalStatus: INVOICE_APPROVAL_STATUS.APPROVED})
            .andWhere('invoice.verificationStatus = :verificationStatus', {verificationStatus: INVOICE_VERIFICATION_STATUS.VERIFIED})
            .andWhere('invoice.isDeleted = false')
            .groupBy('invoice.payer_id')
            .addGroupBy('invoice.payee_id')
            .getRawMany();


        for (const pair of pairs) {
            try {
                await balanceQB()
                    .insert()
                    .values({payer: {id: pair.payer_id}, payee: {id: pair.payee_id}, amount: 0})
                    .onConflict(`("payer_id", "payee_id") DO NOTHING`)
                    .execute();
            } catch(e) {
                console.log('got duplicate', e)
            }

            // Get ids of invoices for the pair

            const ids =  await invQB()
                .select(['id, remaining_amount'])
                .where('invoice.algStatus = :algStatus', {algStatus: INVOICE_ALGORITHM_STATUS.NEW})
                .andWhere('invoice.approvalStatus = :approvalStatus', {approvalStatus: INVOICE_APPROVAL_STATUS.APPROVED})
                .andWhere('invoice.verificationStatus = :verificationStatus', {verificationStatus: INVOICE_VERIFICATION_STATUS.VERIFIED})
                .andWhere('invoice.isDeleted = false')
                .andWhere('invoice.payer = :payer', { payer: pair.payer_id})
                .andWhere('invoice.payee = :payee', { payee: pair.payee_id})
                .getRawMany();

            const amount = await invQB()
                .select("sum(remaining_amount)")
                .where('invoice.algStatus = :algStatus', {algStatus: INVOICE_ALGORITHM_STATUS.NEW})
                .andWhere('invoice.approvalStatus = :approvalStatus', {approvalStatus: INVOICE_APPROVAL_STATUS.APPROVED})
                .andWhere('invoice.verificationStatus = :verificationStatus', {verificationStatus: INVOICE_VERIFICATION_STATUS.VERIFIED})
                .andWhere('invoice.isDeleted = false')
                .andWhere('invoice.payer = :payer', { payer: pair.payer_id})
                .andWhere('invoice.payee = :payee', { payee: pair.payee_id})
                .getRawOne();

            const balanceUpdated = await balanceQB()
                .update()
                .set({
                    amount: () => `amount + ${amount.sum}`,
                    invoiceCount: () => `invoice_count + ${ids.length}`
                })
                .where('payer = :payer', { payer: pair.payer_id})
                .andWhere('payee = :payee', { payee: pair.payee_id})
                .execute();

            const payerUpdated = await corporateQB()
                .update()
                .set({
                    accountsPayable: () => `coalesce(accounts_payable, 0) + ${amount.sum}`
                })
                .where('id = :payer', { payer: pair.payer_id})
                .execute();

            const payeeUpdated = await corporateQB()
                .update()
                .set({
                    accountsReceivable: () => `coalesce(accounts_receivable, 0) + ${amount.sum}`
                })
                .where('id = :payee', { payee: pair.payee_id})
                .execute();

            const invoicesUpdate = await invQB()
                .update()
                .set({algStatus: INVOICE_ALGORITHM_STATUS.READY})
                .whereInIds(ids)
                .execute();

            const balance = await balanceQB()
                .select(['id'])
                .where('payer_id = :payer', { payer: pair.payer_id})
                .andWhere('payee_id = :payee', { payee: pair.payee_id})
                .getRawOne();


            const addInvoiceLink = await balanceInvoiceQB()
                .insert()
                .values(ids.map( r => ({
                    balance: balance,
                    invoice: { id: r.id},
                    amount: r.remaining_amount
                })))
                .onConflict(`("balance_id", "invoice_id") DO NOTHING`)
                .execute();

        }

        return {};
    })
};

export const onCorporateBlocked = async (manager: EntityManager, corporate: Corporate) => {
    const balanceQb = () => manager.getRepository(Balance).createQueryBuilder('balance');
    const invoiceLinkQb = () => manager.getRepository(BalanceInvoice).createQueryBuilder('link');
    const invoiceQb = () => manager.getRepository(Invoice).createQueryBuilder('invoice');
    const corporatesRepo = manager.getRepository(Corporate);

    // start recalculation against blocked corporate
    // get all balances of a corporate
    const balances = await balanceQb()
        .leftJoinAndSelect('balance.payer', 'payer')
        .leftJoinAndSelect('balance.payee', 'payee')
        .where('balance.payer_id = :corpid', {corpid: corporate.id})
        .orWhere('balance.payee_id = :corpid', {corpid: corporate.id})
        .getMany();

    const corporatesMap: {[key: string]: Corporate} = {[corporate.id]: corporate};
    for (const balance of balances) {
        if (balance.payer.id === corporate.id) {
            const payee = corporatesMap[balance.payee.id] || (corporatesMap[balance.payee.id] = balance.payee);
            payee.accountsReceivable = (payee.accountsReceivable || 0) - balance.amount;
            corporate.accountsPayable = (corporate.accountsPayable || 0) - balance.amount;
        } else {
            const payer = corporatesMap[balance.payer.id] || (corporatesMap[balance.payer.id] = balance.payer);
            payer.accountsPayable = (payer.accountsPayable || 0) - balance.amount;
            corporate.accountsReceivable = (corporate.accountsReceivable || 0) - balance.amount;
        }
    }

    await Promise.all(Object.values(corporatesMap).map(c => corporatesRepo.save(c)));

    // get balance-invoice links
    const invoiceLinks = await invoiceLinkQb()
        .leftJoinAndSelect('link.balance', 'balance')
        .leftJoinAndSelect('link.invoice', 'invoice')
        .where(`link.balance_id IN (${balances.map(b => `'${b.id}'`).join(',')})`)
        .getMany();

    // suspend all invoices
    const invoiceIdsToSuspend = invoiceLinks.map(il => il.invoice.id);
    await invoiceQb().update()
        .set({
            algStatus: () => `'${INVOICE_ALGORITHM_STATUS.SUSPENDED}'`
        })
        .whereInIds(invoiceIdsToSuspend).execute();

    // remove links
    await invoiceLinkQb().delete()
        .where(`id IN (${invoiceLinks.map(l => `'${l.id}'`).join(',')})`)
        .execute();

    // remove all balances related to corp
    await balanceQb().delete()
        .where(`id IN (${balances.map(b => `'${b.id}'`).join(',')})`)
        .execute();
};

export const onCorporateActivated = async (manager: EntityManager, corporate: Corporate) => {
    const balanceQb = () => manager.getRepository(Balance).createQueryBuilder('balance');
    const invoiceLinkQb = () => manager.getRepository(BalanceInvoice).createQueryBuilder('link');
    const invoiceQb = () => manager.getRepository(Invoice).createQueryBuilder('invoice');
    const corporatesRepo = manager.getRepository(Corporate);
    const corporateQb = corporatesRepo.createQueryBuilder();
    // start recalculation against activated corporate
    // get all invoices related to corp. (where both payee and payer are ACTIVE)
    const invoices = await invoiceQb()
        .leftJoinAndSelect('invoice.payer', 'payer')
        .leftJoinAndSelect('invoice.payee', 'payee')
        .where('((payee.id = :corpid) OR (payer.id = :corpid))', {corpid: corporate.id})
        .andWhere('invoice.isDeleted = false')
        .getMany();

    // get pairs
    const pairs = await invoiceQb()
        .select(['invoice.payer_id', 'invoice.payee_id'])
        .whereInIds(invoices.map(i => i.id))
        .groupBy('invoice.payer_id')
        .addGroupBy('invoice.payee_id')
        .getRawMany();

    // create balances for each pair
    for (const pair of pairs) {
        try {
            await balanceQb()
                .insert()
                .values({payer: {id: pair.payer_id}, payee: {id: pair.payee_id}, amount: 0})
                .onConflict(`("payer_id", "payee_id") DO NOTHING`)
                .execute();
        } catch(e) {
            console.log('got duplicate', e)
        }

        const ids =  await invoiceQb()
            .select(['id, amount'])
            .whereInIds(invoices.map(i => i.id))
            .andWhere('invoice.isDeleted = false')
            .andWhere('invoice.payer = :payer', { payer: pair.payer_id})
            .andWhere('invoice.payee = :payee', { payee: pair.payee_id})
            .getRawMany();

        // sum amounts and update balances
        const amount = await invoiceQb()
            .select("sum(amount)")
            .where('invoice.isDeleted = false')
            .andWhere('invoice.payer = :payer', { payer: pair.payer_id})
            .andWhere('invoice.payee = :payee', { payee: pair.payee_id})
            .getRawOne();

        await balanceQb()
            .update()
            .set({
                amount: () => `balance.amount + ${amount.sum}`,
                invoiceCount: () => `balance.invoice_count + ${ids.length}`
            })
            .where('balance.payer_id = :payer', { payer: pair.payer_id})
            .andWhere('balance.payee_id = :payee', { payee: pair.payee_id})
            .execute();

        await corporateQb
            .update()
            .set({
                accountsPayable: () => `coalesce(accounts_payable, 0) + ${amount.sum}`
            })
            .where('id = :payer', { payer: pair.payer_id})
            .execute();

        await corporateQb
            .update()
            .set({
                accountsReceivable: () => `coalesce(accounts_receivable, 0) + ${amount.sum}`
            })
            .where('id = :payee', { payee: pair.payee_id})
            .execute();

        const balance = await balanceQb()
            .select(['id'])
            .where('balance.payer_id = :payer', { payer: pair.payer_id})
            .andWhere('balance.payee_id = :payee', { payee: pair.payee_id})
            .getRawOne();

        // add invoice links
        await invoiceLinkQb()
            .insert()
            .values(ids.map( r => ({
                balance: balance,
                invoice: { id: r.id},
                amount: r.amount
            })))
            .onConflict(`("balance_id", "invoice_id") DO NOTHING`)
            .execute();
    }

    // update invoices to status READY
    await invoiceQb().update()
        .set({
            algStatus: () => `'${INVOICE_ALGORITHM_STATUS.READY}'`
        })
        .whereInIds(invoices.map(i => i.id)).execute();

}

export const removeInvoiceFromBalance = async (manager: EntityManager, invoice: Invoice) => {
    const balanceInvoice = await manager.findOne(BalanceInvoice, { invoice });

    if (balanceInvoice) {
        const balanceQb = () => manager.getRepository(Balance).createQueryBuilder('balance');

        await balanceQb().update()
            .set({
                amount: () => `balance.amount - ${balanceInvoice.amount}`,
                invoiceCount: () => `balance.invoice_count - 1`
            })
            .where('balance.payer_id = :payerid', {payerid: invoice.payer.id})
            .andWhere('balance.payee_id = :payeeid', {payeeid: invoice.payee.id})
            .execute();

        await manager.remove(balanceInvoice);
    }
}

export const recalculateForInvoice = async (manager: EntityManager, invoice: Invoice) => {
        const balanceQb = () => manager.getRepository(Balance).createQueryBuilder('balance');
        const invoiceLinkQb = () => manager.getRepository(BalanceInvoice).createQueryBuilder('link');
        const corporateQb = () => manager.getRepository(Corporate).createQueryBuilder();

        if (invoice.isDeleted && invoice.algStatus === INVOICE_ALGORITHM_STATUS.READY) {
            // find balance and subtract invoice amount
            await balanceQb().update()
                .set({
                    amount: () => `balance.amount - ${invoice.amount}`,
                    invoiceCount: () => `balance.invoice_count - 1`
                })
                .where('balance.payer_id = :payerid', {payerid: invoice.payer.id})
                .andWhere('balance.payee_id = :payeeid', {payeeid: invoice.payee.id})
                .execute();

            // remove balance invoice link
            await invoiceLinkQb().delete()
                .where('invoice_id = :invoiceid', {invoiceid: invoice.id})
                .execute();

            // update corporate accounts fields
            await corporateQb()
                .update()
                .set({
                    accountsPayable: () => `accounts_payable - ${invoice.amount}`
                })
                .where('id = :payer', { payer: invoice.payer.id})
                .execute();

            await corporateQb()
                .update()
                .set({
                    accountsReceivable: () => `accounts_receivable - ${invoice.amount}`
                })
                .where('id = :payee', { payee: invoice.payee.id})
                .execute();

        } else {
            return;
        }
}

/**
 * As a part of settlement run execution update balance record after loops and invoices are settleed
 * for now this function will be executed within external transaction
 * @param manager EntityManager
 * @param run SettlemntRun
 */
export const recalculateForRun = async (manager: EntityManager, run: SettlementRun) => {

    // 1. Get Balances affected by run
    // 2. For each balance
        // 2.1 Get affected invoices and amounts
        // 2.2 Update balance record and linked inoice record accordingly
            // 2.2.1 Decrease OR Remove balance by affected invoice amount
            // 2.2.2 Decrease OR Remove linked invoice amount

    const settledBalances = await getBalancesByRun(manager, run);
    for (const settledBalance of settledBalances) {
        const settledInvoices = await getInvoicesByBalance(manager, settledBalance);
        for (const settledInvoice of settledInvoices) {
            await decreaseBalanceInvoiceAmount(manager, settledInvoice.invoice, settledInvoice.amount);
        }
        await decreaseBalanceForPayerPayee(manager, settledBalance.payer, settledBalance.payee, settledBalance.amount);
    }
}

export const updateBalance = async (dto: UpdateBalanceDto) => {
    const connection = await getConnection();
    return await connection.transaction( async manager => {
        const repo = manager.getRepository(Balance);

        let record = await repo.findOne({payer: {id: dto.payerId}, payee: {id: dto.payeeId}});

        if (!record) {
            record = repo.create({
                payer: { id: dto.payerId },
                payee: { id: dto.payeeId},
                amount: 0
            })
        }

        record.amount = Number(record.amount) + dto.amount;

        return await repo.save(record);
    })
}

export const getBalances = async (dto: GetBalancesDto) => {
    const connection = await getConnection();
    return await connection.transaction( async manager => {
        const repo = manager.getRepository(Balance);
        const qb = repo.createQueryBuilder('b')
            /*
            .addSelect(sub => {
                return sub
                    .select("coalesce(count(id), 0)", "invoiceCount")
                    .from(BalanceInvoice, "")
                    .where("b.id = balance_id")
                    .groupBy("balance_id")
            }, "invoiceCount")
            */
            .leftJoinAndSelect("b.payer", "payer")
            .leftJoinAndSelect("b.payee", "payee")
            // .leftJoinAndSelect("b.invoices", "invoices", "invoices.balance_id = b.id");

        qb.where('b.amount > 0');

        const { payer_id, payee_id } = dto;
        if (payer_id) {
            qb.andWhere(`b.payer_id = :payer_id`, { payer_id });
        }

        if (payee_id) {
            qb.andWhere(`b.payee_id = :payee_id`, { payee_id });
        }
        const sortProcessed = dto.sort ?
            // @ts-ignore
            dto.sort
                .split('|')
                .reduce( (acc, part) => {
                    const [prop, dir = 'ASC'] = part.split('_');
                    return {...acc, ...{[prop]: dir}};
                }, {})
                : { amount: "DESC"};

        Object.entries(sortProcessed).map( ([prop, dir])=> {
            // @ts-ignore
            qb.addOrderBy(`${!prop.includes('.') ? 'b.' : ''}${prop}`, dir);
        })

        if (dto.offset) {
            qb.skip(Number(dto.offset));
        }

        if (dto.limit) {
            qb.take(Number(dto.limit))
        }
        return await qb.getManyAndCount();
    })
}

export const getBalance = async (dto: GetBalanceDto) => {
    const connection = await getConnection();
    return await connection.transaction( async manager => {
        const repo = manager.getRepository(Balance);
        const item = await repo.findOne(dto.id);
        if (!item) {
            throw new NotFoundError('There is no such balance record');
        }
        return item;
    })
}

export const getBalanceInvoices = async (dto: GetBalanceInvoicesDto) => {
    const connection = await getConnection();
    return await connection.transaction( async manager => {
        const repo = manager.getRepository(BalanceInvoice);
        const qb = repo.createQueryBuilder('b')
            .leftJoinAndSelect("b.invoice", "invoice")

        qb.where('b.balance_id = :balance_id', { balance_id: dto.id});
        qb.orderBy('b.amount', 'ASC');

        if (dto.offset) {
            qb.skip(Number(dto.offset));
        }

        if (dto.limit) {
            qb.take(Number(dto.limit))
        }

        const invoices = await qb.getManyAndCount();
        return invoices;
    })
}

