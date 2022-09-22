/**
 * 転送取引ルーター
 */
import { chevre } from '@cinerino/domain';
import * as createDebug from 'debug';
import { Router } from 'express';
import { body } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

const transferTransactionsRouter = Router();

import { permitScopes } from '../../middlewares/permitScopes';
import { validator } from '../../middlewares/validator';

const debug = createDebug('pecorino-api:router');

const accountRepo = new chevre.repository.Account(mongoose.connection);
const actionRepo = new chevre.repository.AccountAction(mongoose.connection);
const transactionRepo = new chevre.repository.AccountTransaction(mongoose.connection);

transferTransactionsRouter.post(
    '/start',
    permitScopes(['admin']),
    // 互換性維持
    (req, _, next) => {
        if (typeof req.body.object?.amount === 'number') {
            req.body.object.amount = { value: req.body.object.amount };
        }

        next();
    },
    ...[
        body('project.id')
            .not()
            .isEmpty()
            .withMessage(() => 'required'),
        body('expires')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isISO8601()
            .toDate(),
        body([
            'agent',
            'agent.typeOf',
            'agent.name',
            'recipient',
            'recipient.typeOf',
            'recipient.name'
        ])
            .not()
            .isEmpty()
            .withMessage(() => 'required'),
        body([
            'agent.url',
            'recipient.url'
        ])
            .optional()
            .isString(),
        body('object.amount.value')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isInt()
            .toInt(),
        body('object.fromLocation.accountNumber')
            .not()
            .isEmpty()
            .withMessage(() => 'required'),
        body('object.toLocation.accountNumber')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const transaction = await chevre.service.accountTransaction.transfer.start({
                project: { id: req.body.project.id, typeOf: chevre.factory.organizationType.Project },
                typeOf: chevre.factory.account.transactionType.Transfer,
                agent: {
                    typeOf: req.body.agent.typeOf,
                    id: (typeof req.body.agent.id === 'string') ? req.body.agent.id : req.user.sub,
                    name: req.body.agent.name,
                    ...(typeof req.body.agent.url === 'string') ? { url: req.body.agent.url } : undefined
                },
                recipient: {
                    typeOf: req.body.recipient.typeOf,
                    id: req.body.recipient.id,
                    name: req.body.recipient.name,
                    ...(typeof req.body.recipient.url === 'string') ? { url: req.body.recipient.url } : undefined
                },
                object: {
                    clientUser: req.user,
                    amount: { value: req.body.object.amount.value },
                    fromLocation: { accountNumber: req.body.object.fromLocation.accountNumber },
                    toLocation: { accountNumber: req.body.object.toLocation.accountNumber },
                    description: (typeof req.body.object?.description === 'string') ? req.body.object.description : ''
                },
                expires: req.body.expires,
                ...(typeof req.body.identifier === 'string' && req.body.identifier.length > 0)
                    ? { identifier: req.body.identifier }
                    : undefined,
                ...(typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined
            })({ account: accountRepo, accountAction: actionRepo, accountTransaction: transactionRepo });

            // tslint:disable-next-line:no-string-literal
            // const host = req.headers['host'];
            // res.setHeader('Location', `https://${host}/transactions/${transaction.id}`);
            res.json(transaction);
        } catch (error) {
            next(error);
        }
    }
);

transferTransactionsRouter.put(
    '/:transactionId/confirm',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            await chevre.service.accountTransaction.confirm({
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId },
                typeOf: chevre.factory.account.transactionType.Transfer
            })({ accountTransaction: transactionRepo });
            debug('transaction confirmed.');

            // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            // tslint:disable-next-line:no-floating-promises
            chevre.service.accountTransaction.exportTasks({
                status: chevre.factory.transactionStatusType.Confirmed
            })({
                task: taskRepo,
                accountTransaction: transactionRepo
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

transferTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            await transactionRepo.cancel({
                typeOf: chevre.factory.account.transactionType.Transfer,
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            });
            debug('transaction canceled.');

            // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            // tslint:disable-next-line:no-floating-promises
            chevre.service.accountTransaction.exportTasks({
                status: chevre.factory.transactionStatusType.Canceled
            })({
                task: taskRepo,
                accountTransaction: transactionRepo
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export { transferTransactionsRouter };
