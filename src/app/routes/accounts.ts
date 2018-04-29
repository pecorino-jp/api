/**
 * 口座ルーター
 */

import * as pecorino from '@motionpicture/pecorino-domain';
import * as AWS from 'aws-sdk';
import * as createDebug from 'debug';
import { Router } from 'express';
import { CREATED } from 'http-status';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import requireMember from '../middlewares/requireMember';
import validator from '../middlewares/validator';

const accountsRouter = Router();

const debug = createDebug('pecorino-api:routes:accounts');

accountsRouter.use(authentication);
accountsRouter.use(requireMember);

const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
const actionRepo = new pecorino.repository.Action(pecorino.mongoose.connection);

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
    apiVersion: 'latest',
    region: 'ap-northeast-1',
    credentials: new AWS.Credentials({
        accessKeyId: <string>process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: <string>process.env.AWS_SECRET_ACCESS_KEY
    })
});

const CUSTOM_ATTRIBUTE_NAME = <string>process.env.COGNITO_ATTRIBUTE_NAME_ACCOUNT_ID;

/**
 * 口座開設
 * DBに口座を新規開設し、口座情報をCognitoに連携する
 */
accountsRouter.post(
    '/me',
    permitScopes(['accounts']),
    (__1, __2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const account = await pecorino.service.account.open({
                name: req.body.name,
                initialBalance: (req.body.initialBalance !== undefined) ? parseInt(req.body.initialBalance, 10) : 0
            })({ account: accountRepo });

            let tryCount = 0;
            while (tryCount <= 1) {
                try {
                    tryCount += 1;
                    await addPecorinoAccountId(<string>req.user.username, account.id);

                    break;
                } catch (error) {
                    debug('addPecorinoAccountId failed.', error);

                    // カスタムユーザー属性がない場合、InvalidParameterExceptionエラーがはかれる
                    // 口座ID用のユーザー属性を追加する
                    if (tryCount === 0 && error.code === 'InvalidParameterException') {
                        debug('adding custom attribute....');
                        await addPecorinoAccountAttribute();
                    } else {
                        throw error;
                    }
                }
            }

            res.status(CREATED).json(account);
        } catch (error) {
            next(error);
        }
    }
);

async function addPecorinoAccountId(username: string, accountId: string) {
    await new Promise((resolve, reject) => {
        cognitoIdentityServiceProvider.adminUpdateUserAttributes(
            {
                UserPoolId: <string>process.env.COGNITO_USER_POOL_ID,
                Username: username,
                UserAttributes: [
                    {
                        Name: `custom:${CUSTOM_ATTRIBUTE_NAME}`,
                        Value: accountId
                    }
                ]
            },
            (err) => {
                if (err instanceof Error) {
                    reject(err);
                } else {
                    resolve();
                }
            });
    });
}

async function addPecorinoAccountAttribute() {
    await new Promise((resolve, reject) => {
        cognitoIdentityServiceProvider.addCustomAttributes(
            {
                UserPoolId: <string>process.env.COGNITO_USER_POOL_ID,
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
            },
            (err) => {
                if (err instanceof Error) {
                    reject(err);
                } else {
                    resolve();
                }
            });
    });
}

/**
 * 口座情報取得
 */
accountsRouter.get(
    '/me',
    permitScopes(['accounts', 'accounts.read-only']),
    (__1, __2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            if (req.accountId === undefined) {
                throw new pecorino.factory.errors.NotFound('Account');
            }

            const account = await accountRepo.accountModel.findById(req.accountId).exec();
            res.json(account);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 取引履歴検索
 */
accountsRouter.get(
    '/me/actions/moneyTransfer',
    permitScopes(['accounts.actions', 'accounts.actions.read-only']),
    (_1, _2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            if (req.accountId === undefined) {
                throw new pecorino.factory.errors.NotFound('Account');
            }

            debug('searching trade actions...', req.accountId);
            const actions = await pecorino.service.account.searchTransferActions({
                accountId: req.accountId
            })({ action: actionRepo });

            res.json(actions);
        } catch (error) {
            next(error);
        }
    }
);

export default accountsRouter;
