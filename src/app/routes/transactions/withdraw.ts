/**
 * 支払取引ルーター
 */
import * as pecorino from '@pecorino/domain';
import * as createDebug from 'debug';
import { Router } from 'express';
import { body } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

const withdrawTransactionsRouter = Router();

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const debug = createDebug('pecorino-api:router');

withdrawTransactionsRouter.use(authentication);

const accountRepo = new pecorino.repository.Account(mongoose.connection);
const actionRepo = new pecorino.repository.Action(mongoose.connection);
const transactionRepo = new pecorino.repository.Transaction(mongoose.connection);

withdrawTransactionsRouter.post(
    '/start',
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
        body('expires')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isISO8601(),
        body('agent.name')
            .not()
            .isEmpty()
            .withMessage(() => 'required'),
        body('agent.typeOf')
            .not()
            .isEmpty()
            .withMessage(() => 'required'),
        body('recipient')
            .not()
            .isEmpty()
            .withMessage(() => 'required'),
        body('recipient.typeOf')
            .not()
            .isEmpty()
            .withMessage(() => 'required'),
        body('recipient.name')
            .not()
            .isEmpty()
            .withMessage(() => 'required'),
        body('amount')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isInt(),
        body('fromAccountNumber')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const transaction = await pecorino.service.transaction.withdraw.start({
                project: req.body.project,
                typeOf: pecorino.factory.transactionType.Withdraw,
                agent: {
                    typeOf: req.body.agent.typeOf,
                    id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
                    name: req.body.agent.name,
                    url: req.body.agent.url
                },
                recipient: {
                    typeOf: req.body.recipient.typeOf,
                    id: req.body.recipient.id,
                    name: req.body.recipient.name,
                    url: req.body.recipient.url
                },
                object: {
                    clientUser: req.user,
                    amount: parseInt(req.body.amount, 10),
                    fromLocation: {
                        accountNumber: req.body.fromAccountNumber
                    },
                    description: (req.body.notes !== undefined) ? req.body.notes : ''
                },
                expires: moment(req.body.expires)
                    .toDate(),
                ...(typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined
            })({ account: accountRepo, action: actionRepo, transaction: transactionRepo });

            // tslint:disable-next-line:no-string-literal
            // const host = req.headers['host'];
            // res.setHeader('Location', `https://${host}/transactions/${transaction.id}`);
            res.json(transaction);
        } catch (error) {
            next(error);
        }
    }
);

withdrawTransactionsRouter.put(
    '/:transactionId/confirm',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            await pecorino.service.transaction.confirm({
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId },
                typeOf: pecorino.factory.transactionType.Withdraw
            })({ transaction: transactionRepo });
            debug('transaction confirmed.');

            // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
            const taskRepo = new pecorino.repository.Task(mongoose.connection);
            // tslint:disable-next-line:no-floating-promises
            pecorino.service.transaction.exportTasks({
                status: pecorino.factory.transactionStatusType.Confirmed,
                typeOf: pecorino.factory.transactionType.Withdraw
            })({
                task: taskRepo,
                transaction: transactionRepo
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

withdrawTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            await transactionRepo.cancel({
                typeOf: pecorino.factory.transactionType.Withdraw,
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            });
            debug('transaction canceled.');

            // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
            const taskRepo = new pecorino.repository.Task(mongoose.connection);
            // tslint:disable-next-line:no-floating-promises
            pecorino.service.transaction.exportTasks({
                status: pecorino.factory.transactionStatusType.Canceled,
                typeOf: pecorino.factory.transactionType.Withdraw
            })({
                task: taskRepo,
                transaction: transactionRepo
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

withdrawTransactionsRouter.put(
    '/:transactionId/return',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            await transactionRepo.returnMoneyTransfer({
                typeOf: pecorino.factory.transactionType.Withdraw,
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            });

            // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
            const taskRepo = new pecorino.repository.Task(mongoose.connection);
            // tslint:disable-next-line:no-floating-promises
            pecorino.service.transaction.exportTasks({
                status: pecorino.factory.transactionStatusType.Returned,
                typeOf: pecorino.factory.transactionType.Withdraw
            })({
                task: taskRepo,
                transaction: transactionRepo
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default withdrawTransactionsRouter;
