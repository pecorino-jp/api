/**
 * 口座取引ルーター
 */
import type { chevre } from '@chevre/domain';
import { Router } from 'express';
import { body, Meta, query } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

const accountTransactionsRouter = Router();

import { permitScopes } from '../middlewares/permitScopes';
import { validator } from '../middlewares/validator';

accountTransactionsRouter.get(
    '',
    permitScopes(['admin']),
    ...[
        query('limit')
            .optional()
            .isInt()
            .toInt(),
        query('page')
            .optional()
            .isInt()
            .toInt(),
        query('project.id.$eq')
            .not()
            .isEmpty()
            .isString(),
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
            const transactionRepo = await req.chevre.repository.AccountTransaction.createInstance(mongoose.connection);

            const searchConditions: chevre.factory.account.transaction.ISearchConditions = {
                ...req.query,
                project: { id: { $eq: String(req.query?.project?.id?.$eq) } },
                // tslint:disable-next-line:no-magic-numbers
                limit: (typeof req.query?.limit === 'number') ? Math.min(req.query.limit, 100) : 100,
                page: (typeof req.query?.page === 'number') ? Math.max(req.query.page, 1) : 1,
                sort: (req.query?.sort !== undefined && req.query?.sort !== null)
                    ? req.query.sort
                    : { startDate: req.chevre.factory.sortType.Ascending }
            };
            const accountTransactions = await transactionRepo.search(searchConditions);

            res.json(accountTransactions);
        } catch (error) {
            next(error);
        }
    }
);

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
            // .isIn([
            //     chevre.factory.account.transactionType.Deposit,
            //     chevre.factory.account.transactionType.Transfer,
            //     chevre.factory.account.transactionType.Withdraw
            // ])
            .custom((value, { req }) => {
                if (![
                    req.chevre.factory.account.transactionType.Deposit,
                    req.chevre.factory.account.transactionType.Transfer,
                    req.chevre.factory.account.transactionType.Withdraw

                ].includes(value)) {
                    throw new Error('invalid typeOf');
                }

                return true;
            }),
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
        body('object.amount.value')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isInt()
            .toInt(),
        body('object.fromLocation.accountNumber')
            .if((__: any, meta: Meta) => {
                const transactiontype = meta.req.body.typeOf;

                return transactiontype === meta.req.chevre.factory.account.transactionType.Transfer
                    || transactiontype === meta.req.chevre.factory.account.transactionType.Withdraw;
            })
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isString(),
        body('object.toLocation.accountNumber')
            .if((__: any, meta: Meta) => {
                const transactiontype = meta.req.body.typeOf;

                return transactiontype === meta.req.chevre.factory.account.transactionType.Deposit
                    || transactiontype === meta.req.chevre.factory.account.transactionType.Transfer;
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
            const accountRepo = await req.chevre.repository.Account.createInstance(mongoose.connection);
            const transactionRepo = await req.chevre.repository.AccountTransaction.createInstance(mongoose.connection);

            let transaction: chevre.factory.account.transaction.ITransaction<typeof req.body.typeOf>;
            const agent: chevre.factory.account.transaction.IAgent = {
                typeOf: req.body.agent.typeOf,
                name: req.body.agent.name
            };
            const recipient: chevre.factory.account.transaction.IRecipient = {
                typeOf: req.body.recipient.typeOf,
                name: req.body.recipient.name
            };
            const transactionNumber = String(req.body.transactionNumber);

            switch (req.body.typeOf) {
                case req.chevre.factory.account.transactionType.Deposit:
                    transaction = await (await req.chevre.service.accountTransaction.createService()).deposit.start({
                        project: { id: req.body.project.id, typeOf: req.chevre.factory.organizationType.Project },
                        typeOf: req.chevre.factory.account.transactionType.Deposit,
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
                    })({
                        account: accountRepo,
                        accountTransaction: transactionRepo
                    });

                    break;
                case req.chevre.factory.account.transactionType.Transfer:
                    transaction = await (await req.chevre.service.accountTransaction.createService()).transfer.start({
                        project: { id: req.body.project.id, typeOf: req.chevre.factory.organizationType.Project },
                        typeOf: req.chevre.factory.account.transactionType.Transfer,
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
                    })({
                        account: accountRepo,
                        accountTransaction: transactionRepo
                    });

                    break;
                case req.chevre.factory.account.transactionType.Withdraw:
                    transaction = await (await req.chevre.service.accountTransaction.createService()).withdraw.start({
                        project: { id: req.body.project.id, typeOf: req.chevre.factory.organizationType.Project },
                        typeOf: req.chevre.factory.account.transactionType.Withdraw,
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
                    })({
                        account: accountRepo,
                        accountTransaction: transactionRepo
                    });

                    break;
                default:
                    throw new req.chevre.factory.errors.ArgumentNull('typeOf');
            }

            res.json({
                id: transaction.id,
                transactionNumber: transaction.transactionNumber,
                typeOf: transaction.typeOf
            });
        } catch (error) {
            next(error);
        }
    }
);

accountTransactionsRouter.put(
    '/:transactionNumber/confirm',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const accountRepo = await req.chevre.repository.Account.createInstance(mongoose.connection);
            const transactionRepo = await req.chevre.repository.AccountTransaction.createInstance(mongoose.connection);

            const accountTransaction = await (await req.chevre.service.accountTransaction.createService()).confirm({
                transactionNumber: req.params.transactionNumber
            })({ accountTransaction: transactionRepo });

            const moneyTransferActionAttributes = accountTransaction.potentialActions?.moneyTransfer;
            if (typeof moneyTransferActionAttributes?.typeOf !== 'string') {
                throw new req.chevre.factory.errors.ServiceUnavailable('potentialActions undefined');
            }

            await (await req.chevre.service.account.createService()).transferMoney(moneyTransferActionAttributes)({
                account: accountRepo
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

accountTransactionsRouter.put(
    '/:transactionNumber/cancel',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const accountRepo = await req.chevre.repository.Account.createInstance(mongoose.connection);
            const transactionRepo = await req.chevre.repository.AccountTransaction.createInstance(mongoose.connection);

            const accountTransaction = await transactionRepo.cancel({ transactionNumber: req.params.transactionNumber });

            await (await req.chevre.service.account.createService()).cancelMoneyTransfer({
                transaction: {
                    typeOf: accountTransaction.typeOf,
                    id: accountTransaction.id
                }
            })({
                account: accountRepo,
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
