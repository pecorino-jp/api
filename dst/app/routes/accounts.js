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
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const requireMember_1 = require("../middlewares/requireMember");
const validator_1 = require("../middlewares/validator");
const accountsRouter = express_1.Router();
const debug = createDebug('pecorino-api:routes:accounts');
accountsRouter.use(authentication_1.default);
accountsRouter.use(requireMember_1.default);
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
accountsRouter.post('/me', permitScopes_1.default(['accounts']), (__1, __2, next) => {
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
        yield new Promise((resolve, reject) => {
            cognitoIdentityServiceProvider.adminUpdateUserAttributes({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: username,
                UserAttributes: [
                    {
                        Name: `custom:${CUSTOM_ATTRIBUTE_NAME}`,
                        Value: accountId
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
 * 口座情報取得
 */
accountsRouter.get('/me', permitScopes_1.default(['accounts', 'accounts.read-only']), (__1, __2, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        if (req.accountId === undefined) {
            throw new pecorino.factory.errors.NotFound('Account');
        }
        const account = yield accountRepo.accountModel.findById(req.accountId).exec();
        res.json(account);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 取引履歴検索
 */
accountsRouter.get('/me/actions/moneyTransfer', permitScopes_1.default(['accounts.actions', 'accounts.actions.read-only']), (_1, _2, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        if (req.accountId === undefined) {
            throw new pecorino.factory.errors.NotFound('Account');
        }
        debug('searching trade actions...', req.accountId);
        const actions = yield pecorino.service.account.searchTransferActions({
            accountId: req.accountId
        })({ action: actionRepo });
        res.json(actions);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = accountsRouter;
