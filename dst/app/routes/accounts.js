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
 * 口座ルーター
 */
const pecorino = require("@motionpicture/pecorino-domain");
const createDebug = require("debug");
const express_1 = require("express");
const http_status_1 = require("http-status");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const accountsRouter = express_1.Router();
const debug = createDebug('pecorino-api:routes:accounts');
accountsRouter.use(authentication_1.default);
const redisClient = new pecorino.ioredis({
    host: process.env.REDIS_HOST,
    // tslint:disable-next-line:no-magic-numbers
    port: parseInt(process.env.REDIS_PORT, 10),
    password: process.env.REDIS_KEY,
    tls: { servername: process.env.REDIS_HOST }
});
/**
 * 口座開設
 */
accountsRouter.post('', permitScopes_1.default(['admin']), (__1, __2, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const account = yield pecorino.service.account.open({
            name: req.body.name,
            initialBalance: (req.body.initialBalance !== undefined) ? parseInt(req.body.initialBalance, 10) : 0
        })({
            account: new pecorino.repository.Account(pecorino.mongoose.connection),
            accountNumber: new pecorino.repository.AccountNumber(redisClient)
        });
        res.status(http_status_1.CREATED).json(account);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 口座解約
 * 冪等性の担保された処理となります。
 */
accountsRouter.put('/:accountNumber/close', permitScopes_1.default(['admin']), (_1, _2, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        yield pecorino.service.account.close({ accountNumber: req.params.accountNumber })({
            account: new pecorino.repository.Account(pecorino.mongoose.connection)
        });
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 口座検索
 */
accountsRouter.get('', permitScopes_1.default(['admin']), (__1, __2, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
        const accounts = yield accountRepo.search({
            accountNumbers: req.query.accountNumbers,
            statuses: req.query.statuses,
            name: req.query.name,
            // tslint:disable-next-line:no-magic-numbers
            limit: (Number.isInteger(req.query.limit)) ? req.query.limit : 100
        });
        res.json(accounts);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 取引履歴検索
 */
accountsRouter.get('/:accountNumber/actions/moneyTransfer', permitScopes_1.default(['admin']), (_1, _2, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        debug('searching trade actions...', req.params.accountNumber);
        const actionRepo = new pecorino.repository.Action(pecorino.mongoose.connection);
        const actions = yield actionRepo.searchTransferActions({
            accountNumber: req.params.accountNumber
        });
        res.json(actions);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = accountsRouter;
