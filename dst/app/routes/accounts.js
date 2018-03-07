"use strict";
/**
 * 口座ルーター
 * @module accountsRouter
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
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const requireMember_1 = require("../middlewares/requireMember");
const validator_1 = require("../middlewares/validator");
const accountsRouter = express_1.Router();
const debug = createDebug('pecorino-api:routes:accounts');
accountsRouter.use(authentication_1.default);
accountsRouter.use(requireMember_1.default);
const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
const actionRepo = new pecorino.repository.Action(pecorino.mongoose.connection);
/**
 * 口座情報取得
 */
accountsRouter.get('/me', permitScopes_1.default(['accounts', 'accounts.read-only']), (__1, __2, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const account = yield accountRepo.accountModel.findById(req.accountId).exec();
        res.json(account);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 取引履歴検索
 */
accountsRouter.get('/me/actions/moneyTransfer', permitScopes_1.default(['accounts.actions', 'accounts.actions.read-only']), (_1, _2, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        debug('searching trade actions...', req.accountId);
        const actions = yield pecorino.service.account.searchTransferActions({
            accountId: req.accountId
        })({ action: actionRepo });
        res.json(actions);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = accountsRouter;
