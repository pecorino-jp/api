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
        .isString(),
    (0, express_validator_1.query)('startDate.$gte')
        .optional()
        .isISO8601()
        .toDate(),
    (0, express_validator_1.query)('startDate.$lte')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.validator, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const transactionRepo = yield req.chevre.repository.AccountTransaction.createInstance(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: String((_c = (_b = (_a = req.query) === null || _a === void 0 ? void 0 : _a.project) === null || _b === void 0 ? void 0 : _b.id) === null || _c === void 0 ? void 0 : _c.$eq) } }, limit: (typeof ((_d = req.query) === null || _d === void 0 ? void 0 : _d.limit) === 'number') ? Math.min(req.query.limit, 100) : 100, page: (typeof ((_e = req.query) === null || _e === void 0 ? void 0 : _e.page) === 'number') ? Math.max(req.query.page, 1) : 1, sort: (((_f = req.query) === null || _f === void 0 ? void 0 : _f.sort) !== undefined && ((_g = req.query) === null || _g === void 0 ? void 0 : _g.sort) !== null)
                ? req.query.sort
                : { startDate: req.chevre.factory.sortType.Ascending } });
        const accountTransactions = yield transactionRepo.search(searchConditions);
        res.json(accountTransactions);
    }
    catch (error) {
        next(error);
    }
}));
accountTransactionsRouter.post('/start', (0, permitScopes_1.permitScopes)(['admin']), (req, _, next) => {
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
    (0, express_validator_1.body)('object.amount.value')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isInt()
        .toInt(),
    (0, express_validator_1.body)('object.fromLocation.accountNumber')
        .if((__, meta) => {
        const transactiontype = meta.req.body.typeOf;
        return transactiontype === meta.req.chevre.factory.account.transactionType.Transfer
            || transactiontype === meta.req.chevre.factory.account.transactionType.Withdraw;
    })
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString(),
    (0, express_validator_1.body)('object.toLocation.accountNumber')
        .if((__, meta) => {
        const transactiontype = meta.req.body.typeOf;
        return transactiontype === meta.req.chevre.factory.account.transactionType.Deposit
            || transactiontype === meta.req.chevre.factory.account.transactionType.Transfer;
    })
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString(),
    (0, express_validator_1.body)('object.force')
        .optional()
        .isBoolean()
        .toBoolean()
], validator_1.validator, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _h, _j, _k;
    try {
        const accountRepo = yield req.chevre.repository.Account.createInstance(mongoose.connection);
        const transactionRepo = yield req.chevre.repository.AccountTransaction.createInstance(mongoose.connection);
        let transaction;
        const agent = {
            typeOf: req.body.agent.typeOf,
            name: req.body.agent.name
        };
        const recipient = {
            typeOf: req.body.recipient.typeOf,
            name: req.body.recipient.name
        };
        const transactionNumber = String(req.body.transactionNumber);
        switch (req.body.typeOf) {
            case req.chevre.factory.account.transactionType.Deposit:
                transaction = yield (yield req.chevre.service.accountTransaction.createService()).deposit.start(Object.assign({ project: { id: req.body.project.id, typeOf: req.chevre.factory.organizationType.Project }, typeOf: req.chevre.factory.account.transactionType.Deposit, transactionNumber,
                    agent,
                    recipient, object: {
                        amount: { value: req.body.object.amount.value },
                        toLocation: { accountNumber: req.body.object.toLocation.accountNumber },
                        description: (typeof ((_h = req.body.object) === null || _h === void 0 ? void 0 : _h.description) === 'string') ? req.body.object.description : ''
                    }, expires: req.body.expires }, (typeof req.body.identifier === 'string' && req.body.identifier.length > 0)
                    ? { identifier: req.body.identifier }
                    : undefined))({
                    account: accountRepo,
                    accountTransaction: transactionRepo
                });
                break;
            case req.chevre.factory.account.transactionType.Transfer:
                transaction = yield (yield req.chevre.service.accountTransaction.createService()).transfer.start(Object.assign({ project: { id: req.body.project.id, typeOf: req.chevre.factory.organizationType.Project }, typeOf: req.chevre.factory.account.transactionType.Transfer, transactionNumber,
                    agent,
                    recipient, object: {
                        amount: { value: req.body.object.amount.value },
                        fromLocation: { accountNumber: req.body.object.fromLocation.accountNumber },
                        toLocation: { accountNumber: req.body.object.toLocation.accountNumber },
                        description: (typeof ((_j = req.body.object) === null || _j === void 0 ? void 0 : _j.description) === 'string') ? req.body.object.description : ''
                    }, expires: req.body.expires }, (typeof req.body.identifier === 'string' && req.body.identifier.length > 0)
                    ? { identifier: req.body.identifier }
                    : undefined))({
                    account: accountRepo,
                    accountTransaction: transactionRepo
                });
                break;
            case req.chevre.factory.account.transactionType.Withdraw:
                transaction = yield (yield req.chevre.service.accountTransaction.createService()).withdraw.start(Object.assign({ project: { id: req.body.project.id, typeOf: req.chevre.factory.organizationType.Project }, typeOf: req.chevre.factory.account.transactionType.Withdraw, transactionNumber,
                    agent,
                    recipient, object: {
                        amount: { value: req.body.object.amount.value },
                        fromLocation: { accountNumber: req.body.object.fromLocation.accountNumber },
                        description: (typeof ((_k = req.body.object) === null || _k === void 0 ? void 0 : _k.description) === 'string') ? req.body.object.description : '',
                        force: req.body.object.force === true
                    }, expires: req.body.expires }, (typeof req.body.identifier === 'string' && req.body.identifier.length > 0)
                    ? { identifier: req.body.identifier }
                    : undefined))({
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
    }
    catch (error) {
        next(error);
    }
}));
accountTransactionsRouter.put('/:transactionNumber/confirm', (0, permitScopes_1.permitScopes)(['admin']), validator_1.validator, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _l;
    try {
        const accountRepo = yield req.chevre.repository.Account.createInstance(mongoose.connection);
        const transactionRepo = yield req.chevre.repository.AccountTransaction.createInstance(mongoose.connection);
        const accountTransaction = yield (yield req.chevre.service.accountTransaction.createService()).confirm({
            transactionNumber: req.params.transactionNumber
        })({ accountTransaction: transactionRepo });
        const moneyTransferActionAttributes = (_l = accountTransaction.potentialActions) === null || _l === void 0 ? void 0 : _l.moneyTransfer;
        if (typeof (moneyTransferActionAttributes === null || moneyTransferActionAttributes === void 0 ? void 0 : moneyTransferActionAttributes.typeOf) !== 'string') {
            throw new req.chevre.factory.errors.ServiceUnavailable('potentialActions undefined');
        }
        yield (yield req.chevre.service.account.createService()).transferMoney(moneyTransferActionAttributes)({
            account: accountRepo
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
accountTransactionsRouter.put('/:transactionNumber/cancel', (0, permitScopes_1.permitScopes)(['admin']), validator_1.validator, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountRepo = yield req.chevre.repository.Account.createInstance(mongoose.connection);
        const transactionRepo = yield req.chevre.repository.AccountTransaction.createInstance(mongoose.connection);
        const accountTransaction = yield transactionRepo.cancel({ transactionNumber: req.params.transactionNumber });
        yield (yield req.chevre.service.account.createService()).cancelMoneyTransfer({
            transaction: {
                typeOf: accountTransaction.typeOf,
                id: accountTransaction.id
            }
        })({
            account: accountRepo,
            accountTransaction: transactionRepo
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
