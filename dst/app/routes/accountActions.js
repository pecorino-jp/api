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
 * アクションルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const accountActionsRouter = express_1.Router();
/**
 * アクション検索
 */
accountActionsRouter.get('', permitScopes_1.default(['admin']), ...[
    express_validator_1.query('startDateFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('startDateThrough')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const actionRepo = new chevre.repository.AccountAction(mongoose.connection);
        const actions = yield actionRepo.search(Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 }));
        res.json(actions);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 転送アクション検索
 */
accountActionsRouter.get('/moneyTransfer', permitScopes_1.default(['admin']), ...[
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
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const actionRepo = new chevre.repository.AccountAction(mongoose.connection);
        let actions = yield actionRepo.searchTransferActions(searchConditions);
        // 互換性維持対応
        actions = actions.map((a) => {
            return Object.assign(Object.assign({}, a), { amount: (typeof a.amount === 'number')
                    ? {
                        typeOf: 'MonetaryAmount',
                        currency: 'Point',
                        value: a.amount
                    }
                    : a.amount });
        });
        res.json(actions);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = accountActionsRouter;
