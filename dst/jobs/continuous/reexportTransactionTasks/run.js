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
 * 取引タスクエクスポートが実行中のままになっている取引を監視する
 */
const chevre = require("@chevre/domain");
const createDebug = require("debug");
const connectMongo_1 = require("../../../connectMongo");
const debug = createDebug('pecorino-api');
exports.default = () => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield connectMongo_1.connectMongo({ defaultConnection: false });
    let countRetry = 0;
    const MAX_NUBMER_OF_PARALLEL_TASKS = 10;
    const INTERVAL_MILLISECONDS = 1000;
    const transactionRepo = new chevre.repository.AccountTransaction(connection);
    const RETRY_INTERVAL_MINUTES = 10;
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        if (countRetry > MAX_NUBMER_OF_PARALLEL_TASKS) {
            return;
        }
        countRetry += 1;
        try {
            debug('reexporting tasks...');
            yield transactionRepo.reexportTasks(RETRY_INTERVAL_MINUTES);
        }
        catch (error) {
            // tslint:disable-next-line:no-console
            console.error(error);
        }
        countRetry -= 1;
    }), INTERVAL_MILLISECONDS);
});
