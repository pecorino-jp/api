"use strict";
/**
 * oauthミドルウェア
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_middleware_1 = require("@motionpicture/express-middleware");
const pecorino = require("@motionpicture/pecorino-domain");
const AWS = require("aws-sdk");
const createDebug = require("debug");
const debug = createDebug('pecorino-api:middlewares:authentication');
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
    apiVersion: 'latest',
    region: 'ap-northeast-1'
});
const CUSTOM_ATTRIBUTE_NAME = process.env.COGNITO_ATTRIBUTE_NAME_ACCOUNT_ID;
// 許可発行者リスト
const ISSUERS = process.env.TOKEN_ISSUERS.split(',');
const authentication = express_middleware_1.cognitoAuth({
    issuers: ISSUERS,
    authorizedHandler: (user, token, req, __, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            req.user = user;
            req.accessToken = token;
            req.accountIds = [];
            // Cognitoから口座IDを取得する
            if (req.user.username !== undefined) {
                const cognitoUser = yield getCognitoUser(token);
                debug('cognitoUser:', cognitoUser);
                const attribute = cognitoUser.find((attr) => attr.Name === `custom:${CUSTOM_ATTRIBUTE_NAME}`);
                if (attribute !== undefined && attribute.Value !== undefined) {
                    req.accountIds = JSON.parse(attribute.Value);
                }
            }
            next();
        }
        catch (error) {
            next(new pecorino.factory.errors.Unauthorized(error.message));
        }
    }),
    unauthorizedHandler: (err, __1, __2, next) => {
        debug('unauthorized err handled', err);
        next(new pecorino.factory.errors.Unauthorized(err.message));
    }
});
function getCognitoUser(accesssToken) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            cognitoIdentityServiceProvider.getUser({
                AccessToken: accesssToken
            }, (err, data) => {
                if (err instanceof Error) {
                    reject(err);
                }
                else {
                    const userAttributes = data.UserAttributes;
                    resolve(userAttributes);
                }
            });
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
exports.default = authentication;
