/**
 * 支払取引ルーター
 */
import * as pecorino from '@motionpicture/pecorino-domain';
import * as createDebug from 'debug';
import { Router } from 'express';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';

const payTransactionsRouter = Router();

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const debug = createDebug('pecorino-api:payTransactionsRouter');

payTransactionsRouter.use(authentication);

const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
const transactionRepo = new pecorino.repository.Transaction(pecorino.mongoose.connection);

payTransactionsRouter.post(
    '/start',
    permitScopes(['admin']),
    (req, _, next) => {
        req.checkBody('expires', 'invalid expires').notEmpty().withMessage('expires is required').isISO8601();
        req.checkBody('agent.name', 'invalid agent.name').notEmpty().withMessage('agent.name is required');
        req.checkBody('recipient', 'invalid recipient').notEmpty().withMessage('recipient is required');
        req.checkBody('recipient.typeOf', 'invalid recipient.typeOf').notEmpty().withMessage('recipient.typeOf is required');
        req.checkBody('recipient.id', 'invalid recipient.id').notEmpty().withMessage('recipient.id is required');
        req.checkBody('recipient.name', 'invalid recipient.name').notEmpty().withMessage('recipient.name is required');
        req.checkBody('amount', 'invalid amount').notEmpty().withMessage('amount is required').isInt();
        req.checkBody('fromAccountNumber', 'invalid fromAccountNumber').notEmpty().withMessage('fromAccountNumber is required');

        next();
    },
    validator,
    async (req, res, next) => {
        try {
            // if (req.user.username === undefined) {
            //     throw new pecorino.factory.errors.Forbidden('Undefined username forbidden.');
            // }

            const transaction = await pecorino.service.transaction.pay.start({
                typeOf: pecorino.factory.transactionType.Pay,
                agent: {
                    typeOf: pecorino.factory.personType.Person,
                    id: req.user.sub,
                    name: req.body.agent.name,
                    url: ''
                },
                recipient: {
                    typeOf: req.body.recipient.typeOf,
                    id: req.body.recipient.id,
                    name: req.body.recipient.name,
                    url: (req.body.recipient.url !== undefined) ? req.body.recipient.url : ''
                },
                object: {
                    clientUser: req.user,
                    amount: req.body.amount,
                    fromAccountNumber: req.body.fromAccountNumber,
                    notes: (req.body.notes !== undefined) ? req.body.notes : ''
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

payTransactionsRouter.post(
    '/:transactionId/confirm',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            await pecorino.service.transaction.pay.confirm(
                req.params.transactionId
            )({ transaction: transactionRepo });
            debug('transaction confirmed.');

            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);

payTransactionsRouter.post(
    '/:transactionId/cancel',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            await transactionRepo.cancel(pecorino.factory.transactionType.Pay, req.params.transactionId);
            debug('transaction canceled.');

            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);

export default payTransactionsRouter;
