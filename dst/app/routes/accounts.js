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
 * 口座ルーター
 */
const pecorino = require("@pecorino/domain");
const createDebug = require("debug");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const accountsRouter = express_1.Router();
const debug = createDebug('pecorino-api:router');
accountsRouter.use(authentication_1.default);
/**
 * 口座開設
 */
accountsRouter.post('', permitScopes_1.default(['admin']), ...[
    check_1.body('project.typeOf')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isIn(['Project']),
    check_1.body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    check_1.body('accountType')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    check_1.body('accountNumber')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    check_1.body('name')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const account = yield pecorino.service.account.open({
            project: req.body.project,
            accountType: req.body.accountType,
            accountNumber: req.body.accountNumber,
            name: req.body.name,
            initialBalance: (req.body.initialBalance !== undefined) ? parseInt(req.body.initialBalance, 10) : 0
        })({
            account: new pecorino.repository.Account(mongoose.connection)
        });
        res.status(http_status_1.CREATED)
            .json(account);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 口座編集
 */
accountsRouter.put('/:accountType/:accountNumber', permitScopes_1.default(['admin']), ...[
    check_1.body('name')
        .not()
        .isEmpty()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountRepo = new pecorino.repository.Account(mongoose.connection);
        const update = Object.assign({}, (req.body.name !== undefined) ? { name: String(req.body.name) } : undefined);
        const doc = yield accountRepo.accountModel.findOneAndUpdate({ accountNumber: req.params.accountNumber }, update, { new: true })
            .exec();
        if (doc === null) {
            throw new pecorino.factory.errors.NotFound('Account');
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 口座解約
 * 冪等性の担保された処理となります。
 */
accountsRouter.put('/:accountType/:accountNumber/close', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield pecorino.service.account.close({
            accountNumber: req.params.accountNumber
        })({
            account: new pecorino.repository.Account(mongoose.connection)
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 口座検索
 */
accountsRouter.get('', permitScopes_1.default(['admin']), ...[
    // query('accountType')
    //     .not()
    //     .isEmpty(),
    check_1.query('openDate.$gte')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('openDate.$lte')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountRepo = new pecorino.repository.Account(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const accounts = yield accountRepo.search(searchConditions);
        res.json(accounts);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 取引履歴検索
 */
accountsRouter.get('/:accountType/:accountNumber/actions/moneyTransfer', permitScopes_1.default(['admin']), ...[
    check_1.query('startDate.$gte')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('startDate.$lte')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        debug('searching trade actions...', req.params);
        const actionRepo = new pecorino.repository.Action(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1, 
            // accountType: req.params.accountType,
            accountNumber: req.params.accountNumber });
        const actions = yield actionRepo.searchTransferActions(searchConditions);
        res.json(actions);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = accountsRouter;
