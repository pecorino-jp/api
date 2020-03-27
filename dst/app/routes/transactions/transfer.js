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
 * 転送取引ルーター
 */
const pecorino = require("@pecorino/domain");
const createDebug = require("debug");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const moment = require("moment");
const mongoose = require("mongoose");
const transferTransactionsRouter = express_1.Router();
const authentication_1 = require("../../middlewares/authentication");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const debug = createDebug('pecorino-api:router');
transferTransactionsRouter.use(authentication_1.default);
const accountRepo = new pecorino.repository.Account(mongoose.connection);
const transactionRepo = new pecorino.repository.Transaction(mongoose.connection);
transferTransactionsRouter.post('/start', permitScopes_1.default(['admin']), ...[
    check_1.body('project.typeOf')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isIn(['Project']),
    check_1.body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    check_1.body('expires')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isISO8601(),
    check_1.body('agent.name')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    check_1.body('agent.typeOf')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    check_1.body('recipient')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    check_1.body('recipient.typeOf')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    check_1.body('recipient.name')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    check_1.body('amount')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isInt(),
    check_1.body('accountType')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    check_1.body('fromAccountNumber')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    check_1.body('toAccountNumber')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transaction = yield pecorino.service.transaction.transfer.start({
            project: req.body.project,
            typeOf: pecorino.factory.transactionType.Transfer,
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
                    typeOf: pecorino.factory.account.TypeOf.Account,
                    accountType: req.body.accountType,
                    accountNumber: req.body.fromAccountNumber
                },
                toLocation: {
                    typeOf: pecorino.factory.account.TypeOf.Account,
                    accountType: req.body.accountType,
                    accountNumber: req.body.toAccountNumber
                },
                description: (req.body.notes !== undefined) ? req.body.notes : ''
            },
            expires: moment(req.body.expires)
                .toDate()
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
transferTransactionsRouter.put('/:transactionId/confirm', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield pecorino.service.transaction.transfer.confirm({
            transactionId: req.params.transactionId
        })({ transaction: transactionRepo });
        debug('transaction confirmed.');
        // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
        const taskRepo = new pecorino.repository.Task(mongoose.connection);
        // tslint:disable-next-line:no-floating-promises
        pecorino.service.transaction.transfer.exportTasks(pecorino.factory.transactionStatusType.Confirmed)({
            task: taskRepo,
            transaction: transactionRepo
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
transferTransactionsRouter.put('/:transactionId/cancel', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield transactionRepo.cancel(pecorino.factory.transactionType.Transfer, req.params.transactionId);
        debug('transaction canceled.');
        // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
        const taskRepo = new pecorino.repository.Task(mongoose.connection);
        // tslint:disable-next-line:no-floating-promises
        pecorino.service.transaction.transfer.exportTasks(pecorino.factory.transactionStatusType.Canceled)({
            task: taskRepo,
            transaction: transactionRepo
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = transferTransactionsRouter;
