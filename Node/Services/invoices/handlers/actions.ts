import {APIGatewayProxyResult, Handler} from "aws-lambda";
import {aclGuard, AuthorizedAPIEvent, jwtGuard} from "../../common/jwt-middleware";
import middy from "../../common/middy";
import {USER_TYPES} from "../../auth/libs/constants";
import {errorHandlerMiddleWare} from "../../common/error-handler-middleware";
import {performAction} from "../libs/actions";

import {SQS} from 'aws-sdk';
import {EMAIL_TEMPLATES} from "../../email/libs/constants";
const sqs = new SQS();

const originalHandler: Handler<AuthorizedAPIEvent> = async (event, context): Promise<APIGatewayProxyResult> => {
    context.callbackWaitsForEmptyEventLoop = false;

    const {id} = event.pathParameters || {};
    const {type, ...payload} = JSON.parse(event.body);
    const {userId} = event.auth;

    const {response, emailData} = await performAction({
        invoiceId: id, type, payload, userId
    });

    if (emailData) {
        await sqs.sendMessage({
            QueueUrl: process.env.EMAIL_QUEUE_URL,
            MessageBody: JSON.stringify({
                to: emailData.userEmailTo,
                subject: 'Rejection alert',
                template: EMAIL_TEMPLATES.INVOICE_REJECTION,
                params: emailData
            })
        }).promise();
    }

    return {
        statusCode: 200,
        body: JSON.stringify(response),
        headers: {
            'content-type': 'application/json'
        }
    };
};

export const handler = middy(originalHandler)
    .use(jwtGuard)
    .use(aclGuard([USER_TYPES.CORPORATE_USER]))
    .use(errorHandlerMiddleWare);
