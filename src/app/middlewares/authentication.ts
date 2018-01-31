/**
 * oauthミドルウェア
 * @module middlewares.authentication
 */

import { cognitoAuth } from '@motionpicture/express-middleware';
import * as pecorino from '@motionpicture/pecorino-domain';
import * as AWS from 'aws-sdk';
import * as createDebug from 'debug';

const debug = createDebug('pecorino-api:middlewares:authentication');

// 許可発行者リスト
const ISSUERS = (<string>process.env.TOKEN_ISSUERS).split(',');

const authentication = cognitoAuth({
    issuers: ISSUERS,
    authorizedHandler: async (user, token, req, __, next) => {
        try {
            req.user = user;
            req.accessToken = token;

            // Cognitoから口座IDを取得する
            if (req.user.username !== undefined) {
                const cognitoUser = await getCognitoUser(token);
                debug('cognitoUser:', cognitoUser);
                const attribute = cognitoUser.find((attr) => attr.Name === 'custom:pecorinoAccountId');
                if (attribute === undefined || attribute.Value === undefined) {
                    // Cognitoユーザー属性に口座ID情報が見つからなければNotFound
                    next(new pecorino.factory.errors.NotFound('Account'));

                    return;
                }

                req.accountId = attribute.Value;
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
        const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
            apiVersion: 'latest',
            region: 'ap-northeast-1'
        });

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

export default authentication;
