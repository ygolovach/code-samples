import {INVOICE_ACTIONS, INVOICE_APPROVAL_STATUS, INVOICE_VERIFICATION_STATUS} from "./constants";
import {NotFoundError, ValidationError} from "../../common/error-handler";
import {getConnection} from "../../common/database";
import {Invoice} from "../../common/entities/invoice";
import {User} from "../../common/entities/user";
import {createNotification} from "../../notifications/libs/notification";
import {NotificationTargetType, NotificationType} from "../../common/constants/notification";
import { format } from 'date-fns';

const approveInvoice = async (corporateId: string, invoice: Invoice) => {
    if (invoice.payer.id !== corporateId) {
        throw new ValidationError('Only payer can approve the invoice');
    }

    if (invoice.approvalStatus === INVOICE_APPROVAL_STATUS.APPROVED) {
        throw new ValidationError('Invoice is already approved');
    }

    if (invoice.approvalStatus === INVOICE_APPROVAL_STATUS.REJECTED) {
        throw new ValidationError("Can't approve a rejected invoice");
    }

    const connection = await getConnection();
    const invoiceRepo = connection.getRepository(Invoice);
    await invoiceRepo.save({
        ...invoice,
        approvalStatus: INVOICE_APPROVAL_STATUS.APPROVED,
        approvalDate: new Date().toISOString()
    });

    await createNotification({
        type: NotificationType.INVOICE_APPROVED_BY_PAYER,
        targetType: NotificationTargetType.CORPORATE,
        targetId: invoice.payee.id,
        linkedEntities: [{
            entity: invoice,
            label: 'invoice',
            type: 'invoice'
        }],
    });
};

const verifyInvoice = async (corporateId: string, invoice: Invoice) => {
    if (invoice.payee.id !== corporateId) {
        throw new ValidationError('Only payee can verify the invoice');
    }

    if (invoice.verificationStatus === INVOICE_VERIFICATION_STATUS.VERIFIED) {
        throw new ValidationError('Invoice is already verified');
    }

    if (invoice.verificationStatus === INVOICE_VERIFICATION_STATUS.REJECTED) {
        throw new ValidationError("Can't verify a rejected invoice");
    }

    const connection = await getConnection();
    const invoiceRepo = connection.getRepository(Invoice);
    await invoiceRepo.save({
        ...invoice,
        verificationStatus: INVOICE_VERIFICATION_STATUS.VERIFIED,
        verificationDate: new Date().toISOString()
    });

    await createNotification({
        type: NotificationType.INVOICE_VERIFIED_BY_PAYEE,
        targetType: NotificationTargetType.CORPORATE,
        targetId: invoice.payer.id,
        linkedEntities: [{
            entity: invoice,
            label: 'invoice',
            type: 'invoice'
        }],
    });
};

export const performAction = async (params: {
    invoiceId: string, type: string, payload: any,
    userId: string
}) => {
    const {invoiceId, payload, type, userId} = params;
    if (!Object.values(INVOICE_ACTIONS).includes(params.type as INVOICE_ACTIONS)) {
        throw new ValidationError('Action is not supported', {type});
    }

    const connection = await getConnection();
    const invoice = await connection.getRepository(Invoice).findOne(invoiceId);

    if (!invoice) {
        throw new NotFoundError(`No invoice found with id: ${invoiceId}`);
    }

    const user = await connection.getRepository(User).findOne(userId);
    const corporateId = user.corporate!.id;

    if (![invoice.payee.id, invoice.payer.id].includes(corporateId)) {
        throw new ValidationError('Can\t perform an action on an invoice that doesnt belong to your corporate')
    }

    let response;
    let emailData;
    switch (type) {
        case INVOICE_ACTIONS.APPROVE:
            response = await approveInvoice(corporateId, invoice);
            break;
        case INVOICE_ACTIONS.VERIFY:
            response = await verifyInvoice(corporateId, invoice);
            break;
        case INVOICE_ACTIONS.REJECT:
            const result = await rejectInvoice(corporateId, invoice, payload);
            emailData = result.emailData;
            break;
    }

    return {response, emailData};
}
