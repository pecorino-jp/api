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
exports.healthRouter = void 0;
/**
 * ヘルスチェックルーター
 */
const express = require("express");
const mongoose = require("mongoose");
const healthRouter = express.Router();
exports.healthRouter = healthRouter;
const http_status_1 = require("http-status");
// 接続確認をあきらめる時間(ミリ秒)
const TIMEOUT_GIVE_UP_CHECKING_IN_MILLISECONDS = 3000;
healthRouter.get('', (_, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let timer;
    try {
        yield new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
            let givenUpChecking = false;
            timer = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b;
                // すでにあきらめていたら何もしない
                if (givenUpChecking) {
                    return;
                }
                if (typeof ((_b = (_a = mongoose.connection) === null || _a === void 0 ? void 0 : _a.db) === null || _b === void 0 ? void 0 : _b.admin) !== 'function') {
                    return;
                }
                try {
                    yield mongoose.connection.db.admin()
                        .ping();
                    resolve();
                }
                catch (error) {
                    reject(error);
                }
            }), 
            // tslint:disable-next-line:no-magic-numbers
            500);
            setTimeout(() => {
                givenUpChecking = true;
                reject(new Error('unable to check MongoDB connection'));
            }, TIMEOUT_GIVE_UP_CHECKING_IN_MILLISECONDS);
        }));
        if (timer !== undefined) {
            clearInterval(timer);
        }
        res.status(http_status_1.OK)
            .send('healthy!');
    }
    catch (error) {
        if (timer !== undefined) {
            clearInterval(timer);
        }
        next(error);
    }
}));
