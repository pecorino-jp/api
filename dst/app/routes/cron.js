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
exports.cronRouter = void 0;
/**
 * cronルーター
 */
const domain_1 = require("@cinerino/domain");
const express = require("express");
const http_status_1 = require("http-status");
const moment = require("moment");
const mongoose = require("mongoose");
const ACCOUNT_TRANSACTION_STORAGE_PERIOD_IN_MONTH = (typeof process.env.ACCOUNT_TRANSACTION_STORAGE_PERIOD_IN_MONTH === 'string')
    ? Number(process.env.ACCOUNT_TRANSACTION_STORAGE_PERIOD_IN_MONTH)
    // tslint:disable-next-line:no-magic-numbers
    : 12;
const cronRouter = express.Router();
exports.cronRouter = cronRouter;
cronRouter.get('/cleanUpDatabase', (_, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const accountActionRepo = new domain_1.chevre.repository.AccountAction(mongoose.connection);
        const accountTransactionRepo = new domain_1.chevre.repository.AccountTransaction(mongoose.connection);
        try {
            yield accountActionRepo.clean({
                // 1年以上前に開始したもの
                startDate: {
                    $lt: moment(now)
                        .add(-ACCOUNT_TRANSACTION_STORAGE_PERIOD_IN_MONTH, 'months')
                        .toDate()
                }
            });
            yield accountTransactionRepo.clean({
                // 終了日時を一定期間過ぎたもの
                endDate: {
                    $lt: moment(now)
                        .add(-ACCOUNT_TRANSACTION_STORAGE_PERIOD_IN_MONTH, 'months')
                        .toDate()
                }
            });
        }
        catch (error) {
            // tslint:disable-next-line:no-console
            console.error('accountActionRepo.clean or accountTransactionRepo.clean throws', error);
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
