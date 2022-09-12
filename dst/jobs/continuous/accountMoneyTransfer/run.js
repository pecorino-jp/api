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
exports.accountMoneyTransfer = void 0;
/**
 * 現金転送実行
 */
const domain_1 = require("@cinerino/domain");
const createDebug = require("debug");
const connectMongo_1 = require("../../../connectMongo");
const debug = createDebug('pecorino-api:jobs');
function accountMoneyTransfer() {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = yield (0, connectMongo_1.connectMongo)({ defaultConnection: false });
        let count = 0;
        const MAX_NUBMER_OF_PARALLEL_TASKS = 10;
        const INTERVAL_MILLISECONDS = 100;
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            if (count > MAX_NUBMER_OF_PARALLEL_TASKS) {
                return;
            }
            count += 1;
            try {
                debug('count:', count);
                yield domain_1.chevre.service.task.executeByName({ name: domain_1.chevre.factory.taskName.AccountMoneyTransfer })({
                    connection: connection
                });
            }
            catch (error) {
                // tslint:disable-next-line:no-console
                console.error(error);
            }
            count -= 1;
        }), INTERVAL_MILLISECONDS);
    });
}
exports.accountMoneyTransfer = accountMoneyTransfer;
