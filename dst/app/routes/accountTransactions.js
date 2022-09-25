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
// import { body } from 'express-validator';
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const accountTransactionsRouter = (0, express_1.Router)();
exports.accountTransactionsRouter = accountTransactionsRouter;
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
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
