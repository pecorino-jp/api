/**
 * 口座取引ルーター
 */
import { chevre } from '@cinerino/domain';
import { Router } from 'express';
import { body, Meta } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

const accountTransactionsRouter = Router();

import { permitScopes } from '../middlewares/permitScopes';
import { validator } from '../middlewares/validator';

accountTransactionsRouter.post(
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
        body([
            'project.id',
            'transactionNumber'
        ])
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isString(),
        body([
            'typeOf'
        ])
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isIn([
                chevre.factory.account.transactionType.Deposit,
                chevre.factory.account.transactionType.Transfer,
                chevre.factory.account.transactionType.Withdraw
            ]),
        body('expires')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isISO8601()
            .toDate(),
        body([
            'agent.typeOf',
            'agent.name',
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
            .if((__: any, meta: Meta) => {
                const transactiontype = meta.req.body.typeOf;

                return transactiontype === chevre.factory.account.transactionType.Transfer
                    || transactiontype === chevre.factory.account.transactionType.Withdraw;
            })
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isString(),
        body('object.toLocation.accountNumber')
            .if((__: any, meta: Meta) => {
                const transactiontype = meta.req.body.typeOf;

                return transactiontype === chevre.factory.account.transactionType.Deposit
                    || transactiontype === chevre.factory.account.transactionType.Transfer;
            })
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isString(),
        body('object.force')
            .optional()
            .isBoolean()
            .toBoolean()
    ],
    validator,
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res, next) => {
        try {
            const accountRepo = new chevre.repository.Account(mongoose.connection);
            const actionRepo = new chevre.repository.AccountAction(mongoose.connection);
            const transactionRepo = new chevre.repository.AccountTransaction(mongoose.connection);

            let transaction: chevre.factory.account.transaction.ITransaction<typeof req.body.typeOf>;
            const agent: chevre.factory.account.transaction.IAgent = {
                typeOf: req.body.agent.typeOf,
                id: (typeof req.body.agent.id === 'string') ? req.body.agent.id : req.user.sub,
                name: req.body.agent.name,
                ...(typeof req.body.agent.url === 'string') ? { url: req.body.agent.url } : undefined
            };
            const recipient: chevre.factory.account.transaction.IRecipient = {
                typeOf: req.body.recipient.typeOf,
                id: req.body.recipient.id,
                name: req.body.recipient.name,
                ...(typeof req.body.recipient.url === 'string') ? { url: req.body.recipient.url } : undefined
            };
            const transactionNumber = String(req.body.transactionNumber);

            switch (req.body.typeOf) {
                case chevre.factory.account.transactionType.Deposit:
                    transaction = await chevre.service.accountTransaction.deposit.start({
                        project: { id: req.body.project.id, typeOf: chevre.factory.organizationType.Project },
                        typeOf: chevre.factory.account.transactionType.Deposit,
                        transactionNumber,
                        agent,
                        recipient,
                        object: {
                            amount: { value: req.body.object.amount.value },
                            toLocation: { accountNumber: req.body.object.toLocation.accountNumber },
                            description: (typeof req.body.object?.description === 'string') ? req.body.object.description : ''
                        },
                        expires: req.body.expires,
                        ...(typeof req.body.identifier === 'string' && req.body.identifier.length > 0)
                            ? { identifier: req.body.identifier }
                            : undefined
                    })({ account: accountRepo, accountAction: actionRepo, accountTransaction: transactionRepo });

                    break;
                case chevre.factory.account.transactionType.Transfer:
                    transaction = await chevre.service.accountTransaction.transfer.start({
                        project: { id: req.body.project.id, typeOf: chevre.factory.organizationType.Project },
                        typeOf: chevre.factory.account.transactionType.Transfer,
                        transactionNumber,
                        agent,
                        recipient,
                        object: {
                            amount: { value: req.body.object.amount.value },
                            fromLocation: { accountNumber: req.body.object.fromLocation.accountNumber },
                            toLocation: { accountNumber: req.body.object.toLocation.accountNumber },
                            description: (typeof req.body.object?.description === 'string') ? req.body.object.description : ''
                        },
                        expires: req.body.expires,
                        ...(typeof req.body.identifier === 'string' && req.body.identifier.length > 0)
                            ? { identifier: req.body.identifier }
                            : undefined
                    })({ account: accountRepo, accountAction: actionRepo, accountTransaction: transactionRepo });

                    break;
                case chevre.factory.account.transactionType.Withdraw:
                    transaction = await chevre.service.accountTransaction.withdraw.start({
                        project: { id: req.body.project.id, typeOf: chevre.factory.organizationType.Project },
                        typeOf: chevre.factory.account.transactionType.Withdraw,
                        transactionNumber,
                        agent,
                        recipient,
                        object: {
                            amount: { value: req.body.object.amount.value },
                            fromLocation: { accountNumber: req.body.object.fromLocation.accountNumber },
                            description: (typeof req.body.object?.description === 'string') ? req.body.object.description : '',
                            force: req.body.object.force === true
                        },
                        expires: req.body.expires,
                        ...(typeof req.body.identifier === 'string' && req.body.identifier.length > 0)
                            ? { identifier: req.body.identifier }
                            : undefined
                    })({ account: accountRepo, accountAction: actionRepo, accountTransaction: transactionRepo });

                    break;
                default:
                    throw new chevre.factory.errors.ArgumentNull('typeOf');
            }

            // tslint:disable-next-line:no-string-literal
            // const host = req.headers['host'];
            // res.setHeader('Location', `https://${host}/transactions/${transaction.id}`);
            res.json(transaction);
        } catch (error) {
            next(error);
        }
    }
);

accountTransactionsRouter.put(
    '/:transactionId/confirm',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const transactionRepo = new chevre.repository.AccountTransaction(mongoose.connection);

            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            await chevre.service.accountTransaction.confirm({
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            })({ accountTransaction: transactionRepo });

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

accountTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const transactionRepo = new chevre.repository.AccountTransaction(mongoose.connection);

            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            await transactionRepo.cancel({
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            });

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

export { accountTransactionsRouter };
