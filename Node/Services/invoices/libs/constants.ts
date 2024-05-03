export enum INVOICE_ALGORITHM_STATUS {
    NEW = 'new',
    READY = 'ready',
    LOCKED = 'locked',
    SUSPENDED = 'suspended'
}

export enum INVOICE_SETTLEMENT_STATUS {
    NOT_SETTLED = 'not_settled',
    PARTIALLY_SETTLED = 'partially_settled',
    FULLY_SETTLED = 'fully_settled',
}

export enum INVOICE_APPROVAL_STATUS {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export enum INVOICE_VERIFICATION_STATUS {
    PENDING = 'pending',
    VERIFIED = 'verified',
    REJECTED = 'rejected',
}

export enum INVOICE_ACTIONS {
    APPROVE = 'approve',
    VERIFY = 'verify',
    REJECT = 'reject'
}

export enum INVOICE_ORIGIN {
    BULK_UPLOAD = 'bulk_upload',
    MANUAL_CREATION = 'manual_creation'
}
