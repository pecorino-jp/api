/**
 * アクションルーター
 */
import * as pecorino from '@pecorino/domain';
import { Router } from 'express';
import { query } from 'express-validator';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const USE_MONEY_TRANFER_AMOUNT_AS_NUMBER = process.env.USE_MONEY_TRANFER_AMOUNT_AS_NUMBER === '1';

const actionsRouter = Router();

actionsRouter.use(authentication);

/**
 * アクション検索
 */
actionsRouter.get(
    '',
    permitScopes(['admin']),
    ...[
        query('startDateFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('startDateThrough')
            .optional()
            .isISO8601()
            .toDate()
    ],
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
            let actions = await actionRepo.searchTransferActions(searchConditions);

            // 互換性維持対応
            if (USE_MONEY_TRANFER_AMOUNT_AS_NUMBER) {
                actions = actions.map<any>((a) => {
                    return {
                        ...a,
                        amount: (typeof a.amount === 'number') ? a.amount : Number(a.amount?.value)
                    };
                });
            }

            res.json(actions);
        } catch (error) {
            next(error);
        }
    }
);

export default actionsRouter;
