/**
 * 口座ルーター
 */
import * as pecorino from '@motionpicture/pecorino-domain';
import * as createDebug from 'debug';
import { Router } from 'express';
import { CREATED } from 'http-status';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const accountsRouter = Router();

const debug = createDebug('pecorino-api:routes:accounts');

accountsRouter.use(authentication);

const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
const actionRepo = new pecorino.repository.Action(pecorino.mongoose.connection);

/**
 * 口座開設
 */
accountsRouter.post(
    '',
    permitScopes(['admin']),
    (__1, __2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const account = await accountRepo.open({
                name: req.body.name,
                initialBalance: (req.body.initialBalance !== undefined) ? parseInt(req.body.initialBalance, 10) : 0
            });
            res.status(CREATED).json(account);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 口座検索
 */
accountsRouter.get(
    '',
    permitScopes(['admin']),
    (__1, __2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const accounts = await accountRepo.search({
                ids: req.query.ids,
                statuses: req.query.statuses,
                name: req.query.name,
                // tslint:disable-next-line:no-magic-numbers
                limit: (Number.isInteger(req.query.limit)) ? req.query.limit : 100
            });
            res.json(accounts);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 取引履歴検索
 */
accountsRouter.get(
    '/:accountId/actions/moneyTransfer',
    permitScopes(['admin']),
    (_1, _2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            debug('searching trade actions...', req.params.accountId);
            const actions = await actionRepo.searchTransferActions({
                accountId: req.params.accountId
            });

            res.json(actions);
        } catch (error) {
            next(error);
        }
    }
);

export default accountsRouter;
