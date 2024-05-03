export interface UpdateBalanceDto {
    id?: string;
    payerId: string;
    payeeId: string;
    amount: number;
}

export interface GetBalancesDto {
    limit?: number;
    offset?: number;
    payer_id?: string;
    payee_id?: string;
    sort?: string;
}

export interface GetBalanceDto {
    id: string;
}

export interface GetBalanceInvoicesDto {
    id: string;
    limit?: number;
    offset?: number;
}
