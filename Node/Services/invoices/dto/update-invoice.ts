export interface UpdateInvoiceDTO {
    id: string
    status?: string
    algStatus?: string
    settlementStatus?: string
    earlyPaymentStatus?: boolean
}
