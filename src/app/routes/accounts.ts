/**
 * 口座ルーター
 */
import * as pecorino from '@pecorino/domain';
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
        req.checkBody('accountType', 'invalid accountType').notEmpty().withMessage('accountType is required');
        req.checkBody('accountNumber', 'invalid accountNumber').notEmpty().withMessage('accountNumber is required');
        req.checkBody('name', 'invalid name').notEmpty().withMessage('name is required');
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const account = await pecorino.service.account.open({
                accountType: req.body.accountType,
                accountNumber: req.body.accountNumber,
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
    '/:accountType/:accountNumber/close',
    permitScopes(['admin']),
    (_1, _2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            await pecorino.service.account.close({
                accountType: req.params.accountType,
                accountNumber: req.params.accountNumber
            })({
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
    (req, __2, next) => {
        req.checkQuery('accountType', 'invalid accountType').notEmpty().withMessage('accountType is required');
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
            const searchConditions: pecorino.factory.account.ISearchConditions<pecorino.factory.account.AccountType> = {
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
                sort: (req.query.sort !== undefined) ? req.query.sort : { openDate: pecorino.factory.sortType.Descending },
                accountType: req.query.accountType,
                accountNumbers: req.query.accountNumbers,
                statuses: req.query.statuses,
                name: req.query.name
            };
            const accounts = await accountRepo.search(searchConditions);
            const totalCount = await accountRepo.count(searchConditions);
            res.set('X-Total-Count', totalCount.toString());
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
    '/:accountType/:accountNumber/actions/moneyTransfer',
    permitScopes(['admin']),
    (_1, _2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            debug('searching trade actions...', req.params);
            const actionRepo = new pecorino.repository.Action(pecorino.mongoose.connection);
            const searchConditions: pecorino.factory.action.transfer.moneyTransfer.ISearchConditions<pecorino.factory.account.AccountType>
                = {
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
                sort: (req.query.sort !== undefined) ? req.query.sort : { endDate: pecorino.factory.sortType.Descending },
                accountType: req.params.accountType,
                accountNumber: req.params.accountNumber
            };
            const actions = await actionRepo.searchTransferActions(searchConditions);
            const totalCount = await actionRepo.countTransferActions(searchConditions);
            res.set('X-Total-Count', totalCount.toString());
            res.json(actions);
        } catch (error) {
            next(error);
        }
    }
);
export default accountsRouter;
