/**
 * 口座ルーター
 */

import * as pecorino from '@motionpicture/pecorino-domain';
import * as AWS from 'aws-sdk';
import * as createDebug from 'debug';
import { Router } from 'express';
import { CREATED } from 'http-status';

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import requireMember from '../../middlewares/requireMember';
import validator from '../../middlewares/validator';

const myAccountsRouter = Router();

const debug = createDebug('pecorino-api:routes:accounts');

myAccountsRouter.use(authentication);
myAccountsRouter.use(requireMember);

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
myAccountsRouter.post(
    '',
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
    const accountIds = await getAccountIds(username);
    debug('currently accountIds are', accountIds);

    accountIds.push(accountId);

    await new Promise((resolve, reject) => {
        cognitoIdentityServiceProvider.adminUpdateUserAttributes(
            {
                UserPoolId: <string>process.env.COGNITO_USER_POOL_ID,
                Username: username,
                UserAttributes: [
                    {
                        Name: `custom:${CUSTOM_ATTRIBUTE_NAME}`,
                        Value: JSON.stringify(accountIds)
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
    debug('accountIds adde.', accountIds);
}

async function getAccountIds(username: string) {
    return new Promise<string[]>((resolve, reject) => {
        cognitoIdentityServiceProvider.adminGetUser(
            {
                UserPoolId: <string>process.env.COGNITO_USER_POOL_ID,
                Username: username
            },
            (err, data) => {
                if (err instanceof Error) {
                    reject(err);
                } else {
                    if (data.UserAttributes === undefined) {
                        reject(new Error('UserAttributes not found.'));
                    } else {
                        const attribute = data.UserAttributes.find((a) => a.Name === `custom:${CUSTOM_ATTRIBUTE_NAME}`);
                        resolve((attribute !== undefined && attribute.Value !== undefined) ? JSON.parse(attribute.Value) : []);
                    }
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
 * 自分の口座情報を取得する
 */
myAccountsRouter.get(
    '',
    permitScopes(['accounts', 'accounts.read-only']),
    (__1, __2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const accounts = await accountRepo.accountModel.find({
                _id: { $in: req.accountIds }
            }).exec().then((docs) => docs.map((doc) => doc.toObject()));

            res.json(accounts);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 取引履歴検索
 */
myAccountsRouter.get(
    '/:accountId/actions/moneyTransfer',
    permitScopes(['accounts.actions', 'accounts.actions.read-only']),
    (_1, _2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            if (req.accountIds.indexOf(req.params.accountId) < 0) {
                throw new pecorino.factory.errors.NotFound('Account');
            }

            debug('searching trade actions...', req.params.accountId);
            const actions = await pecorino.service.account.searchTransferActions({
                accountId: req.params.accountId
            })({ action: actionRepo });

            res.json(actions);
        } catch (error) {
            next(error);
        }
    }
);

export default myAccountsRouter;
