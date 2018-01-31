"use strict";
/**
 * 支払取引ルーター
 * @namespace routes.transaction.pay
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const pecorino = require("@motionpicture/pecorino-domain");
const createDebug = require("debug");
const express_1 = require("express");
const http_status_1 = require("http-status");
const moment = require("moment");
const payTransactionsRouter = express_1.Router();
const authentication_1 = require("../../middlewares/authentication");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const debug = createDebug('pecorino-api:payTransactionsRouter');
payTransactionsRouter.use(authentication_1.default);
const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
const transactionRepo = new pecorino.repository.Transaction(pecorino.mongoose.connection);
payTransactionsRouter.post('/start', permitScopes_1.default(['transactions']), (req, _, next) => {
    req.checkBody('expires', 'invalid expires').notEmpty().withMessage('expires is required').isISO8601();
    req.checkBody('recipient', 'invalid recipient').notEmpty().withMessage('recipient is required');
    req.checkBody('recipient.typeOf', 'invalid recipient.typeOf').notEmpty().withMessage('recipient.typeOf is required');
    req.checkBody('recipient.id', 'invalid recipient.id').notEmpty().withMessage('recipient.id is required');
    req.checkBody('recipient.name', 'invalid recipient.name').notEmpty().withMessage('recipient.name is required');
    req.checkBody('price', 'invalid price').notEmpty().withMessage('price is required').isInt();
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        if (req.user.username === undefined) {
            throw new pecorino.factory.errors.Forbidden('Undefined username forbidden.');
        }
        const transaction = yield pecorino.service.transaction.pay.start({
            agent: {
                typeOf: pecorino.factory.personType.Person,
                id: req.user.sub,
                name: req.user.username,
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
                price: req.body.price,
                accountId: req.accountId,
                notes: (req.body.notes !== undefined) ? req.body.notes : ''
            },
            expires: moment(req.body.expires).toDate()
        })(accountRepo, transactionRepo);
        // tslint:disable-next-line:no-string-literal
        // const host = req.headers['host'];
        // res.setHeader('Location', `https://${host}/transactions/${transaction.id}`);
        res.json(transaction);
    }
    catch (error) {
        next(error);
    }
}));
payTransactionsRouter.post('/:transactionId/confirm', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const transactionResult = yield pecorino.service.transaction.pay.confirm(req.params.transactionId)(transactionRepo);
        debug('transaction confirmed', transactionResult);
        res.status(http_status_1.CREATED).json(transactionResult);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = payTransactionsRouter;
