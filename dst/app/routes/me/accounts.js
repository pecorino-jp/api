"use strict";
/**
 * 口座ルーター
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
const pecorino = require("@motionpicture/pecorino-domain");
const AWS = require("aws-sdk");
const createDebug = require("debug");
const express_1 = require("express");
const http_status_1 = require("http-status");
const authentication_1 = require("../../middlewares/authentication");
const permitScopes_1 = require("../../middlewares/permitScopes");
const requireMember_1 = require("../../middlewares/requireMember");
const validator_1 = require("../../middlewares/validator");
const myAccountsRouter = express_1.Router();
const debug = createDebug('pecorino-api:routes:accounts');
myAccountsRouter.use(authentication_1.default);
myAccountsRouter.use(requireMember_1.default);
const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
const actionRepo = new pecorino.repository.Action(pecorino.mongoose.connection);
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
    apiVersion: 'latest',
    region: 'ap-northeast-1',
    credentials: new AWS.Credentials({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    })
});
const CUSTOM_ATTRIBUTE_NAME = process.env.COGNITO_ATTRIBUTE_NAME_ACCOUNT_ID;
/**
 * 口座開設
 * DBに口座を新規開設し、口座情報をCognitoに連携する
 */
myAccountsRouter.post('', permitScopes_1.default(['accounts']), (__1, __2, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const account = yield pecorino.service.account.open({
            name: req.body.name,
            initialBalance: (req.body.initialBalance !== undefined) ? parseInt(req.body.initialBalance, 10) : 0
        })({ account: accountRepo });
        let tryCount = 0;
        while (tryCount <= 1) {
            try {
                tryCount += 1;
                yield addPecorinoAccountId(req.user.username, account.id);
                break;
            }
            catch (error) {
                debug('addPecorinoAccountId failed.', error);
                // カスタムユーザー属性がない場合、InvalidParameterExceptionエラーがはかれる
                // 口座ID用のユーザー属性を追加する
                if (tryCount === 0 && error.code === 'InvalidParameterException') {
                    debug('adding custom attribute....');
                    yield addPecorinoAccountAttribute();
                }
                else {
                    throw error;
                }
            }
        }
        res.status(http_status_1.CREATED).json(account);
    }
    catch (error) {
        next(error);
    }
}));
function addPecorinoAccountId(username, accountId) {
    return __awaiter(this, void 0, void 0, function* () {
        const accountIds = yield getAccountIds(username);
        debug('currently accountIds are', accountIds);
        accountIds.push(accountId);
        yield new Promise((resolve, reject) => {
            cognitoIdentityServiceProvider.adminUpdateUserAttributes({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: username,
                UserAttributes: [
                    {
                        Name: `custom:${CUSTOM_ATTRIBUTE_NAME}`,
                        Value: JSON.stringify(accountIds)
                    }
                ]
            }, (err) => {
                if (err instanceof Error) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
        debug('accountIds adde.', accountIds);
    });
}
function getAccountIds(username) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            cognitoIdentityServiceProvider.adminGetUser({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: username
            }, (err, data) => {
                if (err instanceof Error) {
                    reject(err);
                }
                else {
                    if (data.UserAttributes === undefined) {
                        reject(new Error('UserAttributes not found.'));
                    }
                    else {
                        const attribute = data.UserAttributes.find((a) => a.Name === `custom:${CUSTOM_ATTRIBUTE_NAME}`);
                        resolve((attribute !== undefined && attribute.Value !== undefined) ? JSON.parse(attribute.Value) : []);
                    }
                }
            });
        });
    });
}
function addPecorinoAccountAttribute() {
    return __awaiter(this, void 0, void 0, function* () {
        yield new Promise((resolve, reject) => {
            cognitoIdentityServiceProvider.addCustomAttributes({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                CustomAttributes: [{
                        Name: CUSTOM_ATTRIBUTE_NAME,
                        AttributeDataType: 'String',
                        DeveloperOnlyAttribute: false,
                        /**
                         * 一度作成後変更可能な値かどうか
                         */
                        Mutable: true,
                        Required: false,
                        // NumberAttributeConstraints?: NumberAttributeConstraintsType;
                        StringAttributeConstraints: {
                            MinLength: '1',
                            MaxLength: '256'
                        }
                    }]
            }, (err) => {
                if (err instanceof Error) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    });
}
/**
 * 自分の口座情報を取得する
 */
myAccountsRouter.get('', permitScopes_1.default(['accounts', 'accounts.read-only']), (__1, __2, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accounts = yield accountRepo.accountModel.find({
            _id: { $in: req.accountIds }
        }).exec().then((docs) => docs.map((doc) => doc.toObject()));
        res.json(accounts);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 取引履歴検索
 */
myAccountsRouter.get('/:accountId/actions/moneyTransfer', permitScopes_1.default(['accounts.actions', 'accounts.actions.read-only']), (_1, _2, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        if (req.accountIds.indexOf(req.params.accountId) < 0) {
            throw new pecorino.factory.errors.NotFound('Account');
        }
        debug('searching trade actions...', req.params.accountId);
        const actions = yield pecorino.service.account.searchTransferActions({
            accountId: req.params.accountId
        })({ action: actionRepo });
        res.json(actions);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = myAccountsRouter;
