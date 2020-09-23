/**
 * 口座ルーター
 */
import * as pecorino from '@pecorino/domain';
import * as createDebug from 'debug';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body, query } from 'express-validator/check';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const accountsRouter = Router();

const debug = createDebug('pecorino-api:router');

accountsRouter.use(authentication);

/**
 * 口座開設
 */
accountsRouter.post(
    '',
    permitScopes(['admin']),
    ...[
        body('project.typeOf')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isIn(['Project']),
        body('project.id')
            .not()
            .isEmpty()
            .withMessage(() => 'required'),
        body('accountType')
            .not()
            .isEmpty()
            .withMessage(() => 'required'),
        body('accountNumber')
            .not()
            .isEmpty()
            .withMessage(() => 'required'),
        body('name')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const account = await pecorino.service.account.open({
                project: req.body.project,
                accountType: req.body.accountType,
                accountNumber: req.body.accountNumber,
                name: req.body.name,
                initialBalance: (req.body.initialBalance !== undefined) ? parseInt(req.body.initialBalance, 10) : 0
            })({
                account: new pecorino.repository.Account(mongoose.connection)
            });
            res.status(CREATED)
                .json(account);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 口座編集
 */
accountsRouter.put(
    '/:accountType/:accountNumber',
    permitScopes(['admin']),
    ...[
        body('name')
            .not()
            .isEmpty()
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountRepo = new pecorino.repository.Account(mongoose.connection);

            const update = {
                ...(req.body.name !== undefined) ? { name: String(req.body.name) } : undefined
            };
            const doc = await accountRepo.accountModel.findOneAndUpdate(
                { accountNumber: req.params.accountNumber },
                update,
                { new: true }
            )
                .exec();

            if (doc === null) {
                throw new pecorino.factory.errors.NotFound('Account');
            }

            res.status(NO_CONTENT)
                .end();
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
    validator,
    async (req, res, next) => {
        try {
            await pecorino.service.account.close({
                accountNumber: req.params.accountNumber
            })({
                account: new pecorino.repository.Account(mongoose.connection)
            });

            res.status(NO_CONTENT)
                .end();
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
    ...[
        query('accountType')
            .not()
            .isEmpty(),
        query('openDate.$gte')
            .optional()
            .isISO8601()
            .toDate(),
        query('openDate.$lte')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountRepo = new pecorino.repository.Account(mongoose.connection);
            const searchConditions: pecorino.factory.account.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };
            const accounts = await accountRepo.search(searchConditions);

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
            debug('searching trade actions...', req.params);
            const actionRepo = new pecorino.repository.Action(mongoose.connection);
            const searchConditions: pecorino.factory.action.transfer.moneyTransfer.ISearchConditions
                = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
                accountType: req.params.accountType,
                accountNumber: req.params.accountNumber
            };
            const actions = await actionRepo.searchTransferActions(searchConditions);

            res.json(actions);
        } catch (error) {
            next(error);
        }
    }
);

export default accountsRouter;
