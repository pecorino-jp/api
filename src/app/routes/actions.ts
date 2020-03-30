/**
 * アクションルーター
 */
import * as pecorino from '@pecorino/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { query } from 'express-validator/check';
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
    (req, __, next) => {
        req.checkQuery('startDateFrom')
            .optional()
            .isISO8601()
            .toDate();

        req.checkQuery('startDateThrough')
            .optional()
            .isISO8601()
            .toDate();

        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const actionRepo = new pecorino.repository.Action(mongoose.connection);
            const actions = await actionRepo.search({
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            });

            res.json(actions);
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
    ...[
        query('startDate.$gte')
            .optional()
            .isISO8601()
            .toDate(),
        query('startDate.$lte')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const searchConditions: pecorino.factory.action.transfer.moneyTransfer.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const actionRepo = new pecorino.repository.Action(mongoose.connection);
            const actions = await actionRepo.searchTransferActions(searchConditions);

            res.json(actions);
        } catch (error) {
            next(error);
        }
    }
);

export default actionsRouter;
