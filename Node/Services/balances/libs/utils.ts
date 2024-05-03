import { invalid } from "@hapi/joi";
import {EntityManager, SelectQueryBuilder} from "typeorm";
import { Balance } from "../../common/entities/balance";
import { BalanceInvoice } from "../../common/entities/balance-invoice";
import { Corporate } from "../../common/entities/corporate";
import {Invoice} from "../../common/entities/invoice";
import { SettlementBalance } from "../../common/entities/settlement-balance";
import { SettlementInvoice } from "../../common/entities/settlement-invoice";
import { SettlementLoop } from "../../common/entities/settlement-loop";
import { SettlementRun } from "../../common/entities/settlement-run";
import {INVOICE_ALGORITHM_STATUS} from '../../invoices/libs/constants';


export const getBalancesByRun = async (manager: EntityManager, run: SettlementRun):Promise<SettlementBalance[]> => {
    const loops = await manager.getRepository(SettlementLoop).find({settlementRun: run});
    if (!loops) {
        return [];
    }

    const balanceRepo = manager.getRepository(SettlementBalance);
    const promises: Promise<SettlementBalance[]>[] = [];
    loops.map( loop => promises.push(balanceRepo.find({loop})));

    const balancesArray = await Promise.all(promises);
    return balancesArray.flat();
}

export const getInvoicesByBalance = (manager: EntityManager, balance: SettlementBalance):Promise<SettlementInvoice[]> => {
    return manager.getRepository(SettlementInvoice).find({balance});
}

export const decreaseBalanceForPayerPayee = async (manager: EntityManager, payer: Corporate, payee: Corporate, diff: number) => {
    const repo = manager.getRepository(Balance);
    const balance = await repo.findOne({payer, payee});


    balance.amount = balance.amount - diff;
    if (balance.amount) {
        const balanceInvoiceRepo = manager.getRepository(BalanceInvoice);
        const count = await balanceInvoiceRepo.count({balance});
        balance.invoiceCount = count;
        await repo.save(balance);
    } else {
        await repo.remove(balance)
    }

    // Alternative
    // await repo.decrement({payer, payee}, 'amount', diff);
    // and then delete all balance records where amount is 0
}

export const decreaseInvoiceAmount = async (manager: EntityManager, invoice: Invoice, amount: number) => {
    invoice.remainingAmount = invoice.remainingAmount - amount;
    await manager.save(invoice);
}

export const decreaseBalanceInvoiceAmount = async (manager: EntityManager, invoice: Invoice, amount: number) => {
    const balanceInvoice = await manager.getRepository(BalanceInvoice).findOne({invoice});
    if (balanceInvoice) {
        balanceInvoice.amount = balanceInvoice.amount - amount;
        if (balanceInvoice.amount) {
            await manager.save(balanceInvoice);
        } else {
            await manager.remove(balanceInvoice);
        }
    }
}
