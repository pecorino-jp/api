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
exports.runJobs = void 0;
/**
 * 非同期ジョブ
 */
const run_1 = require("./continuous/abortTasks/run");
const run_2 = require("./continuous/makeTransactionExpired/run");
const run_3 = require("./continuous/reexportTransactionTasks/run");
const run_4 = require("./continuous/retryTasks/run");
const run_5 = require("./continuous/accountMoneyTransfer/run");
const run_6 = require("./continuous/cancelAccountMoneyTransfer/run");
const run_7 = require("./continuous/onDepositCanceled/run");
const run_8 = require("./continuous/onDepositConfirmed/run");
const run_9 = require("./continuous/onDepositExpired/run");
const run_10 = require("./continuous/onTransferCanceled/run");
const run_11 = require("./continuous/onTransferConfirmed/run");
const run_12 = require("./continuous/onTransferExpired/run");
const run_13 = require("./continuous/onWithdrawCanceled/run");
const run_14 = require("./continuous/onWithdrawConfirmed/run");
const run_15 = require("./continuous/onWithdrawExpired/run");
function runJobs() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, run_1.abortTasks)();
        yield (0, run_2.makeTransactionExpired)();
        yield (0, run_3.reexportTransactionTasks)();
        yield (0, run_4.retryTasks)();
        yield (0, run_5.accountMoneyTransfer)();
        yield (0, run_6.cancelAccountMoneyTransfer)();
        yield (0, run_7.onDepositCanceled)();
        yield (0, run_8.onDepositConfirmed)();
        yield (0, run_9.onDepositExpired)();
        yield (0, run_10.onTransferCanceled)();
        yield (0, run_11.onTransferConfirmed)();
        yield (0, run_12.onTransferExpired)();
        yield (0, run_13.onWithdrawCanceled)();
        yield (0, run_14.onWithdrawConfirmed)();
        yield (0, run_15.onWithdrawExpired)();
    });
}
exports.runJobs = runJobs;
