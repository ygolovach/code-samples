import {APIGatewayProxyResult, Handler} from 'aws-lambda';

import {aclGuard, AuthorizedAPIEvent, jwtGuard} from "../../common/jwt-middleware";
import middy from "../../common/middy";
import {errorHandlerMiddleWare} from "../../common/error-handler-middleware";
import {USER_TYPES} from "../../auth/libs/constants";
import {validateBody} from "../../common/validator";
import {createInvoice} from "../libs/invoices";
import schema from "../schemas/create";
import {INVOICE_ORIGIN} from "../libs/constants";

const originalHandler: Handler<AuthorizedAPIEvent> = validateBody(schema, async (event, context): Promise<APIGatewayProxyResult> => {
    context.callbackWaitsForEmptyEventLoop = false;
    const {userId} = event.auth;
    const body = JSON.parse(event.body);
    const response = await createInvoice({...body,
        origin: INVOICE_ORIGIN.MANUAL_CREATION,
        addedBy: userId
    });
    return {
        statusCode: 200,
        body: JSON.stringify(response),
        headers: {
            "content-type": "application/json"
        }
    };
});

export const handler = middy(originalHandler)
    .use(jwtGuard)
    .use(aclGuard([USER_TYPES.SAWI_ADMIN]))
    .use(errorHandlerMiddleWare)
