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
exports.accountTransactionsRouter = void 0;
/**
 * 口座取引ルーター
 */
const domain_1 = require("@cinerino/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const accountTransactionsRouter = (0, express_1.Router)();
exports.accountTransactionsRouter = accountTransactionsRouter;
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
accountTransactionsRouter.get('', (0, permitScopes_1.permitScopes)(['admin']), ...[
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt()
        .toInt(),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt()
        .toInt(),
    (0, express_validator_1.query)('project.id.$eq')
        .not()
        .isEmpty()
        .isString()
], validator_1.validator, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const transactionRepo = new domain_1.chevre.repository.AccountTransaction(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: String((_b = (_a = req.query.project) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.$eq) } }, 
            // tslint:disable-next-line:no-magic-numbers
            limit: (typeof req.query.limit === 'number') ? Math.min(req.query.limit, 100) : 100, page: (typeof req.query.page === 'number') ? Math.max(req.query.page, 1) : 1, sort: (req.query.sort !== undefined && req.query.sort !== null)
                ? req.query.sort
                : { startDate: domain_1.chevre.factory.sortType.Ascending } });
        const accountTransactions = yield transactionRepo.search(searchConditions);
        res.json(accountTransactions);
    }
    catch (error) {
        next(error);
    }
}));
accountTransactionsRouter.post('/start', (0, permitScopes_1.permitScopes)(['admin']), 
// 互換性維持
(req, _, next) => {
    var _a;
    if (typeof ((_a = req.body.object) === null || _a === void 0 ? void 0 : _a.amount) === 'number') {
        req.body.object.amount = { value: req.body.object.amount };
    }
    next();
}, ...[
    (0, express_validator_1.body)([
        'project.id',
        'transactionNumber'
    ])
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString(),
    (0, express_validator_1.body)([
        'typeOf'
    ])
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isIn([
        domain_1.chevre.factory.account.transactionType.Deposit,
        domain_1.chevre.factory.account.transactionType.Transfer,
        domain_1.chevre.factory.account.transactionType.Withdraw
    ]),
    (0, express_validator_1.body)('expires')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isISO8601()
        .toDate(),
    (0, express_validator_1.body)([
        'agent.typeOf',
        'agent.name',
        'recipient.typeOf',
        'recipient.name'
    ])
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    (0, express_validator_1.body)([
        'agent.url',
        'recipient.url'
    ])
        .optional()
        .isString(),
    (0, express_validator_1.body)('object.amount.value')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isInt()
        .toInt(),
    (0, express_validator_1.body)('object.fromLocation.accountNumber')
        .if((__, meta) => {
        const transactiontype = meta.req.body.typeOf;
        return transactiontype === domain_1.chevre.factory.account.transactionType.Transfer
            || transactiontype === domain_1.chevre.factory.account.transactionType.Withdraw;
    })
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString(),
    (0, express_validator_1.body)('object.toLocation.accountNumber')
        .if((__, meta) => {
        const transactiontype = meta.req.body.typeOf;
        return transactiontype === domain_1.chevre.factory.account.transactionType.Deposit
            || transactiontype === domain_1.chevre.factory.account.transactionType.Transfer;
    })
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString(),
    (0, express_validator_1.body)('object.force')
        .optional()
        .isBoolean()
        .toBoolean()
], validator_1.validator, 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e;
    try {
        const accountRepo = new domain_1.chevre.repository.Account(mongoose.connection);
        const actionRepo = new domain_1.chevre.repository.AccountAction(mongoose.connection);
        const transactionRepo = new domain_1.chevre.repository.AccountTransaction(mongoose.connection);
        let transaction;
        const agent = Object.assign({ typeOf: req.body.agent.typeOf, id: (typeof req.body.agent.id === 'string') ? req.body.agent.id : req.user.sub, name: req.body.agent.name }, (typeof req.body.agent.url === 'string') ? { url: req.body.agent.url } : undefined);
        const recipient = Object.assign({ typeOf: req.body.recipient.typeOf, id: req.body.recipient.id, name: req.body.recipient.name }, (typeof req.body.recipient.url === 'string') ? { url: req.body.recipient.url } : undefined);
        const transactionNumber = String(req.body.transactionNumber);
        switch (req.body.typeOf) {
            case domain_1.chevre.factory.account.transactionType.Deposit:
                transaction = yield domain_1.chevre.service.accountTransaction.deposit.start(Object.assign({ project: { id: req.body.project.id, typeOf: domain_1.chevre.factory.organizationType.Project }, typeOf: domain_1.chevre.factory.account.transactionType.Deposit, transactionNumber,
                    agent,
                    recipient, object: {
                        amount: { value: req.body.object.amount.value },
                        toLocation: { accountNumber: req.body.object.toLocation.accountNumber },
                        description: (typeof ((_c = req.body.object) === null || _c === void 0 ? void 0 : _c.description) === 'string') ? req.body.object.description : ''
                    }, expires: req.body.expires }, (typeof req.body.identifier === 'string' && req.body.identifier.length > 0)
                    ? { identifier: req.body.identifier }
                    : undefined))({ account: accountRepo, accountAction: actionRepo, accountTransaction: transactionRepo });
                break;
            case domain_1.chevre.factory.account.transactionType.Transfer:
                transaction = yield domain_1.chevre.service.accountTransaction.transfer.start(Object.assign({ project: { id: req.body.project.id, typeOf: domain_1.chevre.factory.organizationType.Project }, typeOf: domain_1.chevre.factory.account.transactionType.Transfer, transactionNumber,
                    agent,
                    recipient, object: {
                        amount: { value: req.body.object.amount.value },
                        fromLocation: { accountNumber: req.body.object.fromLocation.accountNumber },
                        toLocation: { accountNumber: req.body.object.toLocation.accountNumber },
                        description: (typeof ((_d = req.body.object) === null || _d === void 0 ? void 0 : _d.description) === 'string') ? req.body.object.description : ''
                    }, expires: req.body.expires }, (typeof req.body.identifier === 'string' && req.body.identifier.length > 0)
                    ? { identifier: req.body.identifier }
                    : undefined))({ account: accountRepo, accountAction: actionRepo, accountTransaction: transactionRepo });
                break;
            case domain_1.chevre.factory.account.transactionType.Withdraw:
                transaction = yield domain_1.chevre.service.accountTransaction.withdraw.start(Object.assign({ project: { id: req.body.project.id, typeOf: domain_1.chevre.factory.organizationType.Project }, typeOf: domain_1.chevre.factory.account.transactionType.Withdraw, transactionNumber,
                    agent,
                    recipient, object: {
                        amount: { value: req.body.object.amount.value },
                        fromLocation: { accountNumber: req.body.object.fromLocation.accountNumber },
                        description: (typeof ((_e = req.body.object) === null || _e === void 0 ? void 0 : _e.description) === 'string') ? req.body.object.description : '',
                        force: req.body.object.force === true
                    }, expires: req.body.expires }, (typeof req.body.identifier === 'string' && req.body.identifier.length > 0)
                    ? { identifier: req.body.identifier }
                    : undefined))({ account: accountRepo, accountAction: actionRepo, accountTransaction: transactionRepo });
                break;
            default:
                throw new domain_1.chevre.factory.errors.ArgumentNull('typeOf');
        }
        // tslint:disable-next-line:no-string-literal
        // const host = req.headers['host'];
        // res.setHeader('Location', `https://${host}/transactions/${transaction.id}`);
        res.json(transaction);
    }
    catch (error) {
        next(error);
    }
}));
accountTransactionsRouter.put('/:transactionId/confirm', (0, permitScopes_1.permitScopes)(['admin']), validator_1.validator, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionRepo = new domain_1.chevre.repository.AccountTransaction(mongoose.connection);
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        yield domain_1.chevre.service.accountTransaction.confirm(Object.assign({}, (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }))({ accountTransaction: transactionRepo });
        // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
        const taskRepo = new domain_1.chevre.repository.Task(mongoose.connection);
        // tslint:disable-next-line:no-floating-promises
        domain_1.chevre.service.accountTransaction.exportTasks({
            status: domain_1.chevre.factory.transactionStatusType.Confirmed
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
accountTransactionsRouter.put('/:transactionId/cancel', (0, permitScopes_1.permitScopes)(['admin']), validator_1.validator, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionRepo = new domain_1.chevre.repository.AccountTransaction(mongoose.connection);
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        yield transactionRepo.cancel(Object.assign({}, (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }));
        // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
        const taskRepo = new domain_1.chevre.repository.Task(mongoose.connection);
        // tslint:disable-next-line:no-floating-promises
        domain_1.chevre.service.accountTransaction.exportTasks({
            status: domain_1.chevre.factory.transactionStatusType.Canceled
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
