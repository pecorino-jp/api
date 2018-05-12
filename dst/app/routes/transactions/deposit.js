"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 入金取引ルーター
 */
const pecorino = require("@motionpicture/pecorino-domain");
const createDebug = require("debug");
const express_1 = require("express");
const http_status_1 = require("http-status");
const moment = require("moment");
const depositTransactionsRouter = express_1.Router();
const authentication_1 = require("../../middlewares/authentication");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const debug = createDebug('pecorino-api:depositTransactionsRouter');
depositTransactionsRouter.use(authentication_1.default);
const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
const transactionRepo = new pecorino.repository.Transaction(pecorino.mongoose.connection);
depositTransactionsRouter.post('/start', permitScopes_1.default(['admin']), (req, _, next) => {
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
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const transaction = yield pecorino.service.transaction.deposit.start({
            typeOf: pecorino.factory.transactionType.Deposit,
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
        })({ account: accountRepo, transaction: transactionRepo });
        // tslint:disable-next-line:no-string-literal
        // const host = req.headers['host'];
        // res.setHeader('Location', `https://${host}/transactions/${transaction.id}`);
        res.json(transaction);
    }
    catch (error) {
        next(error);
    }
}));
depositTransactionsRouter.post('/:transactionId/confirm', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        yield pecorino.service.transaction.deposit.confirm(req.params.transactionId)({ transaction: transactionRepo });
        debug('transaction confirmed.');
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
depositTransactionsRouter.post('/:transactionId/cancel', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        yield transactionRepo.cancel(pecorino.factory.transactionType.Deposit, req.params.transactionId);
        debug('transaction canceled.');
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = depositTransactionsRouter;
