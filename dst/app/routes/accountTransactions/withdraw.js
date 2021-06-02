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
 * 支払取引ルーター
 */
const chevre = require("@chevre/domain");
const createDebug = require("debug");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const withdrawTransactionsRouter = express_1.Router();
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const debug = createDebug('pecorino-api:router');
const accountRepo = new chevre.repository.Account(mongoose.connection);
const actionRepo = new chevre.repository.AccountAction(mongoose.connection);
const transactionRepo = new chevre.repository.AccountTransaction(mongoose.connection);
withdrawTransactionsRouter.post('/start', permitScopes_1.default(['admin']), 
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
    express_validator_1.body('object.fromLocation.accountNumber')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const transaction = yield chevre.service.accountTransaction.withdraw.start(Object.assign(Object.assign({ project: { id: req.body.project.id, typeOf: chevre.factory.organizationType.Project }, typeOf: chevre.factory.account.transactionType.Withdraw, agent: {
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
                fromLocation: { accountNumber: req.body.object.fromLocation.accountNumber },
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
withdrawTransactionsRouter.put('/:transactionId/confirm', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        yield chevre.service.accountTransaction.confirm(Object.assign(Object.assign({}, (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }), { typeOf: chevre.factory.account.transactionType.Withdraw }))({ accountTransaction: transactionRepo });
        debug('transaction confirmed.');
        // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        // tslint:disable-next-line:no-floating-promises
        chevre.service.accountTransaction.exportTasks({
            status: chevre.factory.transactionStatusType.Confirmed,
            typeOf: chevre.factory.account.transactionType.Withdraw
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
withdrawTransactionsRouter.put('/:transactionId/cancel', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        yield transactionRepo.cancel(Object.assign({ typeOf: chevre.factory.account.transactionType.Withdraw }, (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }));
        debug('transaction canceled.');
        // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        // tslint:disable-next-line:no-floating-promises
        chevre.service.accountTransaction.exportTasks({
            status: chevre.factory.transactionStatusType.Canceled,
            typeOf: chevre.factory.account.transactionType.Withdraw
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
// withdrawTransactionsRouter.put(
//     '/:transactionId/return',
//     permitScopes(['admin']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
//             await transactionRepo.returnMoneyTransfer({
//                 typeOf: chevre.factory.account.transactionType.Withdraw,
//                 ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
//             });
//             // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
//             const taskRepo = new chevre.repository.Task(mongoose.connection);
//             // tslint:disable-next-line:no-floating-promises
//             chevre.service.transaction.exportTasks({
//                 status: chevre.factory.transactionStatusType.Returned,
//                 typeOf: chevre.factory.account.transactionType.Withdraw
//             })({
//                 task: taskRepo,
//                 transaction: transactionRepo
//             });
//             res.status(NO_CONTENT)
//                 .end();
//         } catch (error) {
//             next(error);
//         }
//     }
// );
exports.default = withdrawTransactionsRouter;
