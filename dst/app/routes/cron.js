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
// import * as moment from 'moment';
const mongoose = require("mongoose");
const cronRouter = express.Router();
exports.cronRouter = cronRouter;
cronRouter.get('/cleanUpDatabase', (_, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const now = new Date();
        // const actionRepo = new chevre.repository.Action(mongoose.connection);
        // // actions
        // try {
        //     await actionRepo.deleteEndDatePassedCertainPeriod({
        //         $lt: moment(now)
        //             // tslint:disable-next-line:no-magic-numbers
        //             .add(-24, 'months')
        //             .toDate()
        //     });
        // } catch (error) {
        //     // tslint:disable-next-line:no-console
        //     console.error('actionRepo.deleteEndDatePassedCertainPeriod throws', error);
        // }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
cronRouter.get('/makeTransactionExpires', (_, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const accountTransactionRepo = new domain_1.chevre.repository.AccountTransaction(mongoose.connection);
        yield accountTransactionRepo.makeExpired({ expires: now });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
const REEXPORT_TRANSACTION_TASK_INTERVAL_MINUTES = 10;
cronRouter.get('/reexportTransactionTasks', (_, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountTransactionRepo = new domain_1.chevre.repository.AccountTransaction(mongoose.connection);
        yield accountTransactionRepo.reexportTasks({ intervalInMinutes: REEXPORT_TRANSACTION_TASK_INTERVAL_MINUTES });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
