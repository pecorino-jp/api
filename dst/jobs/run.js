"use strict";
/**
 * 非同期ジョブ
 */
// import { makeTransactionExpired } from './continuous/makeTransactionExpired/run';
// import { reexportTransactionTasks } from './continuous/reexportTransactionTasks/run';
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
const run_1 = require("./continuous/accountMoneyTransfer/run");
const run_2 = require("./continuous/cancelAccountMoneyTransfer/run");
const run_3 = require("./continuous/onAccountTransactionCanceled/run");
const run_4 = require("./continuous/onAccountTransactionConfirmed/run");
const run_5 = require("./continuous/onAccountTransactionExpired/run");
function runJobs() {
    return __awaiter(this, void 0, void 0, function* () {
        // await makeTransactionExpired();
        // await reexportTransactionTasks();
        yield (0, run_1.accountMoneyTransfer)();
        yield (0, run_2.cancelAccountMoneyTransfer)();
        yield (0, run_3.onAccountTransactionCanceled)();
        yield (0, run_4.onAccountTransactionConfirmed)();
        yield (0, run_5.onAccountTransactionExpired)();
    });
}
exports.runJobs = runJobs;
