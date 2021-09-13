"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 入金取引ルーター
 */
const domain_1 = require("@cinerino/domain");
const createDebug = require("debug");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const depositTransactionsRouter = express_1.Router();
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const debug = createDebug('pecorino-api:router');
const accountRepo = new domain_1.chevre.repository.Account(mongoose.connection);
const actionRepo = new domain_1.chevre.repository.AccountAction(mongoose.connection);
const transactionRepo = new domain_1.chevre.repository.AccountTransaction(mongoose.connection);
depositTransactionsRouter.post('/start', permitScopes_1.default(['admin']), 
// 互換性維持
(req, _, next) => {
    var _a;
    if (typeof ((_a = req.body.object) === null || _a === void 0 ? void 0 : _a.amount) === 'number') {
        req.body.object.amount = { value: req.body.object.amount };
    }
    next();
}, ...[
    express_validator_1.body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    express_validator_1.body('expires')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isISO8601()
        .toDate(),
    express_validator_1.body([
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
    express_validator_1.body('object.amount.value')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isInt()
        .toInt(),
    express_validator_1.body('object.toLocation.accountNumber')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const transaction = yield domain_1.chevre.service.accountTransaction.deposit.start(Object.assign(Object.assign({ project: { id: req.body.project.id, typeOf: domain_1.chevre.factory.organizationType.Project }, typeOf: domain_1.chevre.factory.account.transactionType.Deposit, agent: {
                typeOf: req.body.agent.typeOf,
                id: (typeof req.body.agent.id === 'string') ? req.body.agent.id : req.user.sub,
                name: req.body.agent.name,
                url: req.body.agent.url
            }, recipient: {
                typeOf: req.body.recipient.typeOf,
                id: req.body.recipient.id,
                name: req.body.recipient.name,
                url: req.body.recipient.url
            }, object: {
                clientUser: req.user,
                amount: { value: req.body.object.amount.value },
                toLocation: { accountNumber: req.body.object.toLocation.accountNumber },
                description: (typeof ((_a = req.body.object) === null || _a === void 0 ? void 0 : _a.description) === 'string') ? req.body.object.description : ''
            }, expires: req.body.expires }, (typeof req.body.identifier === 'string' && req.body.identifier.length > 0)
            ? { identifier: req.body.identifier }
            : undefined), (typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined))({ account: accountRepo, accountAction: actionRepo, accountTransaction: transactionRepo });
        // tslint:disable-next-line:no-string-literal
        // const host = req.headers['host'];
        // res.setHeader('Location', `https://${host}/transactions/${transaction.id}`);
        res.json(transaction);
    }
    catch (error) {
        next(error);
    }
}));
depositTransactionsRouter.put('/:transactionId/confirm', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        yield domain_1.chevre.service.accountTransaction.confirm(Object.assign(Object.assign({}, (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }), { typeOf: domain_1.chevre.factory.account.transactionType.Deposit }))({ accountTransaction: transactionRepo });
        debug('transaction confirmed.');
        // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
        const taskRepo = new domain_1.chevre.repository.Task(mongoose.connection);
        // tslint:disable-next-line:no-floating-promises
        domain_1.chevre.service.accountTransaction.exportTasks({
            status: domain_1.chevre.factory.transactionStatusType.Confirmed,
            typeOf: domain_1.chevre.factory.account.transactionType.Deposit
        })({
            task: taskRepo,
            accountTransaction: transactionRepo
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
depositTransactionsRouter.put('/:transactionId/cancel', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        yield transactionRepo.cancel(Object.assign({ typeOf: domain_1.chevre.factory.account.transactionType.Deposit }, (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }));
        debug('transaction canceled.');
        // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
        const taskRepo = new domain_1.chevre.repository.Task(mongoose.connection);
        // tslint:disable-next-line:no-floating-promises
        domain_1.chevre.service.accountTransaction.exportTasks({
            status: domain_1.chevre.factory.transactionStatusType.Canceled,
            typeOf: domain_1.chevre.factory.account.transactionType.Deposit
        })({
            task: taskRepo,
            accountTransaction: transactionRepo
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = depositTransactionsRouter;
