import {APIGatewayProxyResult, Handler} from 'aws-lambda';

import {AuthorizedAPIEvent, aclGuard, jwtGuard} from "../../common/jwt-middleware";
import middy from "../../common/middy";
import {errorHandlerMiddleWare} from "../../common/error-handler-middleware";
import {USER_TYPES} from "../../auth/libs/constants";
import {getBalances} from "../libs/balances";

const originalHandler: Handler<AuthorizedAPIEvent> = async (event, context): Promise<APIGatewayProxyResult> => {
    context.callbackWaitsForEmptyEventLoop = false;
    const {offset = '0', limit = '10', sort, payer_id, payee_id} = event.queryStringParameters || {};
    return {
        statusCode: 200,
        body: JSON.stringify(await getBalances({
            offset: Number(offset),
            limit: Number(limit),
            sort,
            payer_id,
            payee_id,
        })),
        headers: {
            "content-type": "application/json"
        }
    }
}

export const handler = middy(originalHandler)
    .use(jwtGuard)
    .use(aclGuard([USER_TYPES.ADMIN]))
    .use(errorHandlerMiddleWare)
