/**
 * 口座ルーター
 * @module accountsRouter
 */

import * as pecorino from '@motionpicture/pecorino-domain';
import * as createDebug from 'debug';
import { Router } from 'express';

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
