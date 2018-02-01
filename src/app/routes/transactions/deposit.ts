/**
 * 入金取引ルーター
 * @namespace routes.transaction.deposit
 */

import * as pecorino from '@motionpicture/pecorino-domain';
import * as createDebug from 'debug';
import { Router } from 'express';
import { CREATED } from 'http-status';
import * as moment from 'moment';

const depositTransactionsRouter = Router();

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const debug = createDebug('pecorino-api:depositTransactionsRouter');

depositTransactionsRouter.use(authentication);

const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
const depositTransactionRepo = new pecorino.repository.transaction.Deposit(pecorino.mongoose.connection);

depositTransactionsRouter.post(
    '/start',
    permitScopes(['admin']),
    (req, _, next) => {
        req.checkBody('expires', 'invalid expires').notEmpty().withMessage('expires is required').isISO8601();

        req.checkBody('agent', 'invalid agent').notEmpty().withMessage('agent is required');
        req.checkBody('agent.typeOf', 'invalid agent.typeOf').notEmpty().withMessage('agent.typeOf is required');
        req.checkBody('agent.id', 'invalid agent.id').notEmpty().withMessage('agent.id is required');
        req.checkBody('agent.name', 'invalid agent.name').notEmpty().withMessage('agent.name is required');

        req.checkBody('recipient', 'invalid recipient').notEmpty().withMessage('recipient is required');
        req.checkBody('recipient.typeOf', 'invalid recipient.typeOf').notEmpty().withMessage('recipient.typeOf is required');
        req.checkBody('recipient.id', 'invalid recipient.id').notEmpty().withMessage('recipient.id is required');
        req.checkBody('recipient.name', 'invalid recipient.name').notEmpty().withMessage('recipient.name is required');

        req.checkBody('price', 'invalid price').notEmpty().withMessage('price is required').isInt();
        req.checkBody('toAccountId', 'invalid toAccountId').notEmpty().withMessage('toAccountId is required');

        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const transaction = await pecorino.service.transaction.deposit.start({
                agent: {
                    typeOf: req.body.agent.typeOf,
                    id: req.body.agent.id,
                    name: req.body.agent.name,
                    url: (req.body.agent.url !== undefined) ? req.body.agent.url : ''
                },
                recipient: {
                    typeOf: req.body.recipient.typeOf,
                    id: req.body.recipient.id,
                    name: req.body.recipient.name,
                    url: (req.body.recipient.url !== undefined) ? req.body.recipient.url : ''
                },
                object: {
                    clientUser: req.user,
                    price: req.body.price,
                    toAccountId: req.body.toAccountId,
                    notes: (req.body.notes !== undefined) ? req.body.notes : ''
                },
                expires: moment(req.body.expires).toDate()
            })(accountRepo, depositTransactionRepo);

            // tslint:disable-next-line:no-string-literal
            // const host = req.headers['host'];
            // res.setHeader('Location', `https://${host}/transactions/${transaction.id}`);
            res.json(transaction);
        } catch (error) {
            next(error);
        }
    }
);

depositTransactionsRouter.post(
    '/:transactionId/confirm',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const transactionResult = await pecorino.service.transaction.deposit.confirm(
                req.params.transactionId
            )(depositTransactionRepo);
            debug('transaction confirmed', transactionResult);

            res.status(CREATED).json(transactionResult);
        } catch (error) {
            next(error);
        }
    }
);

export default depositTransactionsRouter;
