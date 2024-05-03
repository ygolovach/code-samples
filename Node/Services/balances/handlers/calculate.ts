import {calculate} from '../libs/balances';

export const handler = async (event: any) => {
    await calculate();

    return {};
}
