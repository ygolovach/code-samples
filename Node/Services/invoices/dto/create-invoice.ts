import {INVOICE_ORIGIN} from "../libs/constants";

export interface CreateInvoiceDTO {
    corporateId: string,
    addedBy: string,
    externalId: string,
    payerId: string,
    payeeId: string,
    issueDate: string,
    dueDate: string,
    amount: number,
    origin?: INVOICE_ORIGIN
    currencyCode?: string;
    earlyPaymentStatus?: boolean;
    earlyPaymentDueDate?: string;
    earlyPaymentDiscountPercent?: number;
}
