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
 * mongooseコネクション確立
 */
const createDebug = require("debug");
const mongoose = require("mongoose");
const debug = createDebug('pecorino-api:*');
const PING_INTERVAL = 10000;
const connectOptions = {
    autoReconnect: true,
    keepAlive: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 0,
    reconnectTries: 30,
    reconnectInterval: 1000
};
function connectMongo() {
    return __awaiter(this, void 0, void 0, function* () {
        // コネクション確立
        yield mongoose.connect(process.env.MONGOLAB_URI, connectOptions);
        // 定期的にコネクションチェック
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore next */
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            // すでに接続済かどうか
            if (mongoose.connection.readyState === 1) {
                // 接続済であれば疎通確認
                let pingResult;
                try {
                    pingResult = yield mongoose.connection.db.admin().ping();
                    debug('pingResult:', pingResult);
                }
                catch (error) {
                    // tslint:disable-next-line:no-console
                    console.error('ping:', error);
                }
                // 疎通確認結果が適性であれば何もしない
                if (pingResult !== undefined && pingResult.ok === 1) {
                    return;
                }
            }
            // コネクション確立
            try {
                yield mongoose.connect(process.env.MONGOLAB_URI, connectOptions);
                debug('MongoDB connected!');
            }
            catch (error) {
                // tslint:disable-next-line:no-console
                console.error('mongoose.connect:', error);
            }
        }), PING_INTERVAL);
    });
}
exports.connectMongo = connectMongo;
