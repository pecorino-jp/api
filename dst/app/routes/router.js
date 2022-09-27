"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
/**
 * ルーター
 */
const express = require("express");
const health_1 = require("./health");
const _ah_1 = require("./_ah");
const accountTransactions_1 = require("./accountTransactions");
const permits_1 = require("./permits");
const authentication_1 = require("../middlewares/authentication");
const router = express.Router();
exports.router = router;
// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })
router.get('', (__, res) => {
    res.send('hello!');
});
router.use('/_ah', _ah_1.ahRouter);
router.use('/health', health_1.healthRouter);
// 認証
router.use(authentication_1.authentication);
router.use('/accountTransactions', accountTransactions_1.accountTransactionsRouter);
router.use('/permits', permits_1.permitsRouter);
