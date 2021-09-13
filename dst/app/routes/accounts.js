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
const domain_1 = require("@cinerino/domain");
const createDebug = require("debug");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const accountsRouter = express_1.Router();
const debug = createDebug('pecorino-api:router');
const MAX_NUM_ACCOUNTS_CREATED = 100;
/**
 * 口座に対するバリデーション
 */
const validations = [
    (req, _, next) => {
        // 単一リソース、複数リソースの両方に対応するため、bodyがオブジェクトの場合配列に変換
        req.body = (Array.isArray(req.body)) ? req.body : [req.body];
        next();
    },
    express_validator_1.body()
        .isArray({ max: MAX_NUM_ACCOUNTS_CREATED })
        .withMessage(() => `must be array <= ${MAX_NUM_ACCOUNTS_CREATED}`),
    express_validator_1.body('*.project.typeOf')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isIn([domain_1.chevre.factory.organizationType.Project]),
    express_validator_1.body('*.project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString(),
    express_validator_1.body('*.accountType')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString(),
    express_validator_1.body('*.accountNumber')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString(),
    express_validator_1.body('*.name')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString(),
    express_validator_1.body('*.initialBalance')
        .optional()
        .isInt()
        .toInt()
];
/**
 * 口座開設
 */
accountsRouter.post('', permitScopes_1.default(['admin']), ...validations, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accounts = yield domain_1.chevre.service.account.open(req.body.map((bodyParams) => {
            var _a, _b;
            return {
                project: { id: (_a = bodyParams.project) === null || _a === void 0 ? void 0 : _a.id, typeOf: (_b = bodyParams.project) === null || _b === void 0 ? void 0 : _b.typeOf },
                // 互換性維持対応として、未指定であれば'Account'
                typeOf: (typeof bodyParams.typeOf === 'string' && bodyParams.typeOf.length > 0) ? bodyParams.typeOf : 'Account',
                accountType: bodyParams.accountType,
                accountNumber: bodyParams.accountNumber,
                name: bodyParams.name,
                initialBalance: (typeof bodyParams.initialBalance === 'number') ? Number(bodyParams.initialBalance) : 0
            };
        }))({
            account: new domain_1.chevre.repository.Account(mongoose.connection)
        });
        if (accounts.length === 1) {
            res.status(http_status_1.CREATED)
                .json(accounts[0]);
        }
        else {
            res.status(http_status_1.CREATED)
                .json(accounts);
        }
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 口座検索
 */
accountsRouter.get('', permitScopes_1.default(['admin']), ...[
    express_validator_1.query('openDate.$gte')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('openDate.$lte')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountRepo = new domain_1.chevre.repository.Account(mongoose.connection);
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
 * 口座編集
 */
accountsRouter.put('/:accountNumber', permitScopes_1.default(['admin']), ...[
    express_validator_1.body('name')
        .not()
        .isEmpty()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountRepo = new domain_1.chevre.repository.Account(mongoose.connection);
        const update = Object.assign({}, (req.body.name !== undefined) ? { name: String(req.body.name) } : undefined);
        const doc = yield accountRepo.accountModel.findOneAndUpdate({ accountNumber: req.params.accountNumber }, update, { new: true })
            .exec();
        if (doc === null) {
            throw new domain_1.chevre.factory.errors.NotFound('Account');
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
accountsRouter.put('/:accountNumber/close', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield domain_1.chevre.service.account.close({
            accountNumber: req.params.accountNumber
        })({
            account: new domain_1.chevre.repository.Account(mongoose.connection)
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 取引履歴検索
 */
accountsRouter.get('/:accountNumber/actions/moneyTransfer', permitScopes_1.default(['admin']), ...[
    express_validator_1.query('startDate.$gte')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('startDate.$lte')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        debug('searching trade actions...', req.params);
        const actionRepo = new domain_1.chevre.repository.AccountAction(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1, accountNumber: req.params.accountNumber });
        const actions = yield actionRepo.searchTransferActions(searchConditions);
        res.json(actions);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = accountsRouter;
