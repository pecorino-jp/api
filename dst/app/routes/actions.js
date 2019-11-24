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
 * アクションルーター
 */
const pecorino = require("@pecorino/domain");
const express_1 = require("express");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const actionsRouter = express_1.Router();
actionsRouter.use(authentication_1.default);
/**
 * アクション検索
 */
actionsRouter.get('', permitScopes_1.default(['admin']), (req, __, next) => {
    req.checkQuery('startDateFrom')
        .optional()
        .isISO8601()
        .toDate();
    req.checkQuery('startDateThrough')
        .optional()
        .isISO8601()
        .toDate();
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const actionRepo = new pecorino.repository.Action(mongoose.connection);
        const actions = yield actionRepo.search(Object.assign({}, req.query, { 
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
actionsRouter.get('/moneyTransfer', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const searchConditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const actionRepo = new pecorino.repository.Action(mongoose.connection);
        const totalCount = yield actionRepo.countTransferActions(searchConditions);
        const actions = yield actionRepo.searchTransferActions(searchConditions);
        res.set('X-Total-Count', totalCount.toString());
        res.json(actions);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = actionsRouter;
