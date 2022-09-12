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
exports.retryTasks = void 0;
/**
 * タスクリトライ
 */
const domain_1 = require("@cinerino/domain");
const connectMongo_1 = require("../../../connectMongo");
function retryTasks() {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = yield (0, connectMongo_1.connectMongo)({ defaultConnection: false });
        let count = 0;
        const MAX_NUBMER_OF_PARALLEL_TASKS = 10;
        const INTERVAL_MILLISECONDS = 1000;
        const RETRY_INTERVAL_MINUTES = 10;
        const taskRepo = new domain_1.chevre.repository.Task(connection);
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            if (count > MAX_NUBMER_OF_PARALLEL_TASKS) {
                return;
            }
            count += 1;
            try {
                yield domain_1.chevre.service.task.retry({ intervalInMinutes: RETRY_INTERVAL_MINUTES })({ task: taskRepo });
            }
            catch (error) {
                // tslint:disable-next-line:no-console
                console.error(error);
            }
            count -= 1;
        }), INTERVAL_MILLISECONDS);
    });
}
exports.retryTasks = retryTasks;
