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
 * 非同期ジョブ
 */
const run_1 = require("./continuous/abortTasks/run");
const run_2 = require("./continuous/makeTransactionExpired/run");
const run_3 = require("./continuous/reexportTransactionTasks/run");
const run_4 = require("./continuous/retryTasks/run");
const run_5 = require("./continuous/cancelMoneyTransfer/run");
const run_6 = require("./continuous/moneyTransfer/run");
const run_7 = require("./continuous/onCanceledDepositTransaction/run");
const run_8 = require("./continuous/onCanceledTransferTransaction/run");
const run_9 = require("./continuous/onCanceledWithdrawTransaction/run");
const run_10 = require("./continuous/onConfirmedDepositTransaction/run");
const run_11 = require("./continuous/onConfirmedTransferTransaction/run");
const run_12 = require("./continuous/onConfirmedWithdrawTransaction/run");
const run_13 = require("./continuous/onExpiredDepositTransaction/run");
const run_14 = require("./continuous/onExpiredTransferTransaction/run");
const run_15 = require("./continuous/onExpiredWithdrawTransaction/run");
exports.default = () => __awaiter(void 0, void 0, void 0, function* () {
    yield run_1.default();
    yield run_2.default();
    yield run_3.default();
    yield run_4.default();
    yield run_5.default();
    yield run_6.default();
    yield run_7.default();
    yield run_8.default();
    yield run_9.default();
    yield run_10.default();
    yield run_11.default();
    yield run_12.default();
    yield run_13.default();
    yield run_14.default();
    yield run_15.default();
});
