export interface GetInvoicesDTO {
    type?: string;
    user_corporate_id?: string;
    corporate_id?: string;
    payee_id?: string;
    payer_id?: string;
    status?: string;
    date_start?: string;
    date_end?: string;
    sort?: string;
    limit?: string;
    offset?: string;
    av_status?: string;
    av_date_start?: string
    av_date_end?: string
    rejection_date_start?: string
    rejection_date_end?: string
}
