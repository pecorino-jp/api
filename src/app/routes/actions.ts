/**
 * アクションルーター
 */
import * as pecorino from '@pecorino/domain';
import { Router } from 'express';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const actionsRouter = Router();

actionsRouter.use(authentication);

/**
 * アクション検索
 */
actionsRouter.get(
    '',
    permitScopes(['admin']),
    (__1, __2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const actionRepo = new pecorino.repository.Action(mongoose.connection);
            const accounts = await actionRepo.search({
                typeOf: req.query.typeOf,
                actionStatuses: req.query.actionStatuses,
                startDateFrom: req.query.startDateFrom,
                startDateThrough: req.query.startDateThrough,
                purposeTypeOfs: req.query.purposeTypeOfs,
                fromLocationAccountNumbers: req.query.fromLocationAccountNumbers,
                toLocationAccountNumbers: req.query.toLocationAccountNumbers,
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
 * 転送アクション検索
 */
actionsRouter.get(
    '/moneyTransfer',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const searchConditions: pecorino.factory.action.transfer.moneyTransfer.ISearchConditions<pecorino.factory.account.AccountType>
                = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const actionRepo = new pecorino.repository.Action(mongoose.connection);
            const totalCount = await actionRepo.countTransferActions(searchConditions);
            const actions = await actionRepo.searchTransferActions(searchConditions);

            res.set('X-Total-Count', totalCount.toString());
            res.json(actions);
        } catch (error) {
            next(error);
        }
    }
);

export default actionsRouter;
