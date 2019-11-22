/**
 * 入金取引ルーター
 */
import * as pecorino from '@pecorino/domain';
import * as createDebug from 'debug';
import { Router } from 'express';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

const depositTransactionsRouter = Router();

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const debug = createDebug('pecorino-api:depositTransactionsRouter');

depositTransactionsRouter.use(authentication);

const accountRepo = new pecorino.repository.Account(mongoose.connection);
const transactionRepo = new pecorino.repository.Transaction(mongoose.connection);

depositTransactionsRouter.post(
    '/start',
    permitScopes(['admin']),
    (req, _, next) => {
        req.checkBody('expires', 'invalid expires').notEmpty().withMessage('expires is required').isISO8601();
        req.checkBody('agent', 'invalid agent').notEmpty().withMessage('agent is required');
        req.checkBody('agent.typeOf', 'invalid agent.typeOf').notEmpty().withMessage('agent.typeOf is required');
        req.checkBody('agent.name', 'invalid agent.name').notEmpty().withMessage('agent.name is required');
        req.checkBody('recipient', 'invalid recipient').notEmpty().withMessage('recipient is required');
        req.checkBody('recipient.typeOf', 'invalid recipient.typeOf').notEmpty().withMessage('recipient.typeOf is required');
        req.checkBody('recipient.name', 'invalid recipient.name').notEmpty().withMessage('recipient.name is required');
        req.checkBody('amount', 'invalid amount').notEmpty().withMessage('amount is required').isInt();
        req.checkBody('accountType', 'invalid accountType').notEmpty().withMessage('accountType is required');
        req.checkBody('toAccountNumber', 'invalid toAccountNumber').notEmpty().withMessage('toAccountNumber is required');

        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const project: any = (req.body.project !== undefined && req.body.project !== null)
                ? { ...req.body.project, typeOf: 'Project' }
                : { typeOf: 'Project', id: <string>process.env.PROJECT_ID };

            const transaction = await pecorino.service.transaction.deposit.start({
                project: project,
                typeOf: pecorino.factory.transactionType.Deposit,
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
                    toLocation: {
                        typeOf: pecorino.factory.account.TypeOf.Account,
                        accountType: req.body.accountType,
                        accountNumber: req.body.toAccountNumber
                    },
                    description: (req.body.notes !== undefined) ? req.body.notes : ''
                },
                expires: moment(req.body.expires).toDate()
            })({ account: accountRepo, transaction: transactionRepo });

            // tslint:disable-next-line:no-string-literal
            // const host = req.headers['host'];
            // res.setHeader('Location', `https://${host}/transactions/${transaction.id}`);
            res.json(transaction);
        } catch (error) {
            next(error);
        }
    }
);

depositTransactionsRouter.put(
    '/:transactionId/confirm',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            await pecorino.service.transaction.deposit.confirm({
                transactionId: req.params.transactionId
            })({ transaction: transactionRepo });
            debug('transaction confirmed.');

            // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
            const taskRepo = new pecorino.repository.Task(mongoose.connection);
            // tslint:disable-next-line:no-floating-promises
            pecorino.service.transaction.deposit.exportTasks(pecorino.factory.transactionStatusType.Confirmed)({
                task: taskRepo,
                transaction: transactionRepo
            });

            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);

depositTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            await transactionRepo.cancel(pecorino.factory.transactionType.Deposit, req.params.transactionId);
            debug('transaction canceled.');

            // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
            const taskRepo = new pecorino.repository.Task(mongoose.connection);
            // tslint:disable-next-line:no-floating-promises
            pecorino.service.transaction.deposit.exportTasks(pecorino.factory.transactionStatusType.Canceled)({
                task: taskRepo,
                transaction: transactionRepo
            });

            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);

export default depositTransactionsRouter;
