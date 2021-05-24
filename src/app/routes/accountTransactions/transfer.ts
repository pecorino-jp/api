/**
 * 転送取引ルーター
 */
import * as chevre from '@chevre/domain';
import * as createDebug from 'debug';
import { Router } from 'express';
import { body } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

const transferTransactionsRouter = Router();

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const debug = createDebug('pecorino-api:router');

transferTransactionsRouter.use(authentication);

const accountRepo = new chevre.repository.Account(mongoose.connection);
const actionRepo = new chevre.repository.AccountAction(mongoose.connection);
const transactionRepo = new chevre.repository.AccountTransaction(mongoose.connection);

transferTransactionsRouter.post(
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
            .withMessage(() => 'required'),
        body('toAccountNumber')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const transaction = await chevre.service.accountTransaction.transfer.start({
                project: req.body.project,
                typeOf: chevre.factory.account.transactionType.Transfer,
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
                    toLocation: {
                        accountNumber: req.body.toAccountNumber
                    },
                    description: (req.body.notes !== undefined) ? req.body.notes : ''
                },
                expires: moment(req.body.expires)
                    .toDate(),
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
                status: chevre.factory.transactionStatusType.Confirmed,
                typeOf: chevre.factory.account.transactionType.Transfer
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
                status: chevre.factory.transactionStatusType.Canceled,
                typeOf: chevre.factory.account.transactionType.Transfer
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

export default transferTransactionsRouter;
