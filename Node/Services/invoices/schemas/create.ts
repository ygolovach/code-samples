import {object, string, date, number, boolean, ref, required} from 'joi';
import {CreateInvoiceDTO} from "../dto/create-invoice";

const schema = object<CreateInvoiceDTO>({
    corporateId: string().uuid().required(),
    externalId: string().required(),
    payerId: string().uuid().required(),
    payeeId: string().uuid().required(),
    issueDate: date().iso().required(),
    dueDate: date().iso().greater(ref('issueDate')).required(),
    amount: number().greater(0).required(),
    currencyCode: string().length(3),
    earlyPaymentStatus: boolean(),
    earlyPaymentDueDate: date()
        .greater(ref('issueDate'))
        .less(ref('dueDate'))
        .when(ref('earlyPaymentStatus'), {
            is: boolean().valid(true),
            then: required(),
        }),
    earlyPaymentDiscountPercent: number()
        .greater(0)
        .less(100)
        .precision(1)
        .when(ref('earlyPaymentStatus'), {
            is: boolean().valid(true),
            then: required(),
        }),
});

export default schema;
