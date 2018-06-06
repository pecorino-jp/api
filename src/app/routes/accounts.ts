/**
 * 口座ルーター
 */
import * as pecorino from '@motionpicture/pecorino-domain';
import * as createDebug from 'debug';
import { Router } from 'express';
import { CREATED, NO_CONTENT } from 'http-status';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const accountsRouter = Router();

const debug = createDebug('pecorino-api:routes:accounts');

accountsRouter.use(authentication);

/**
 * 口座開設
 */
accountsRouter.post(
    '',
    permitScopes(['admin']),
    (req, __2, next) => {
        req.checkBody('name', 'invalid name').notEmpty().withMessage('name is required');
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const account = await pecorino.service.account.open({
                accountNumber: (req.body.accountNumber !== undefined) ? req.body.accountNumber : '',
                name: req.body.name,
                initialBalance: (req.body.initialBalance !== undefined) ? parseInt(req.body.initialBalance, 10) : 0
            })({
                account: new pecorino.repository.Account(pecorino.mongoose.connection)
            });
            res.status(CREATED).json(account);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 口座解約
 * 冪等性の担保された処理となります。
 */
accountsRouter.put(
    '/:accountNumber/close',
    permitScopes(['admin']),
    (_1, _2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            await pecorino.service.account.close({ accountNumber: req.params.accountNumber })({
                account: new pecorino.repository.Account(pecorino.mongoose.connection)
            });
            res.status(NO_CONTENT).end();
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
            const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
            const accounts = await accountRepo.search({
                accountNumbers: req.query.accountNumbers,
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
    '/:accountNumber/actions/moneyTransfer',
    permitScopes(['admin']),
    (_1, _2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            debug('searching trade actions...', req.params.accountNumber);
            const actionRepo = new pecorino.repository.Action(pecorino.mongoose.connection);
            const actions = await actionRepo.searchTransferActions({
                accountNumber: req.params.accountNumber
            });
            res.json(actions);
        } catch (error) {
            next(error);
        }
    }
);

export default accountsRouter;
