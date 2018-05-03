/**
 * oauthミドルウェア
 */

import { cognitoAuth } from '@motionpicture/express-middleware';
import * as pecorino from '@motionpicture/pecorino-domain';
import * as AWS from 'aws-sdk';
import * as createDebug from 'debug';

const debug = createDebug('pecorino-api:middlewares:authentication');

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
    apiVersion: 'latest',
    region: 'ap-northeast-1'
});

const CUSTOM_ATTRIBUTE_NAME = <string>process.env.COGNITO_ATTRIBUTE_NAME_ACCOUNT_ID;

// 許可発行者リスト
const ISSUERS = (<string>process.env.TOKEN_ISSUERS).split(',');

const authentication = cognitoAuth({
    issuers: ISSUERS,
    authorizedHandler: async (user, token, req, __, next) => {
        try {
            req.user = user;
            req.accessToken = token;
            req.accountIds = [];

            // Cognitoから口座IDを取得する
            if (req.user.username !== undefined) {
                const cognitoUser = await getCognitoUser(token);
                debug('cognitoUser:', cognitoUser);
                const attribute = cognitoUser.find((attr) => attr.Name === `custom:${CUSTOM_ATTRIBUTE_NAME}`);
                if (attribute !== undefined && attribute.Value !== undefined) {
                    req.accountIds = JSON.parse(attribute.Value);
                }
            }

            next();
        } catch (error) {
            next(new pecorino.factory.errors.Unauthorized(error.message));
        }
    },
    unauthorizedHandler: (err, __1, __2, next) => {
        debug('unauthorized err handled', err);
        next(new pecorino.factory.errors.Unauthorized(err.message));
    }
});

async function getCognitoUser(accesssToken: string) {
    return new Promise<AWS.CognitoIdentityServiceProvider.AttributeType[]>((resolve, reject) => {
        cognitoIdentityServiceProvider.getUser(
            {
                AccessToken: accesssToken
            },
            (err, data) => {
                if (err instanceof Error) {
                    reject(err);
                } else {
                    const userAttributes = data.UserAttributes;
                    resolve(userAttributes);
                }
            });
    });
}

// async function getAccountIds(username: string) {
//     return new Promise<string[]>((resolve, reject) => {
//         cognitoIdentityServiceProvider.adminGetUser(
//             {
//                 UserPoolId: <string>process.env.COGNITO_USER_POOL_ID,
//                 Username: username
//             },
//             (err, data) => {
//                 if (err instanceof Error) {
//                     reject(err);
//                 } else {
//                     if (data.UserAttributes === undefined) {
//                         reject(new Error('UserAttributes not found.'));
//                     } else {
//                         const attribute = data.UserAttributes.find((a) => a.Name === `custom:${CUSTOM_ATTRIBUTE_NAME}`);
//                         resolve((attribute !== undefined && attribute.Value !== undefined) ? JSON.parse(attribute.Value) : []);
//                     }
//                 }
//             });
//     });
// }

export default authentication;
