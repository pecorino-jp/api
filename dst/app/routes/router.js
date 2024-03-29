"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
/**
 * ルーター
 */
const express = require("express");
const health_1 = require("./health");
const accountTransactions_1 = require("./accountTransactions");
const cron_1 = require("./cron");
const permits_1 = require("./permits");
// import { ssktsMembershipCouponRouter } from './ssktsMembershipCoupon';
// import { ssktsSurfrockRouter } from './ssktsSurfrock';
const authentication_1 = require("../middlewares/authentication");
const requireDomain_1 = require("../middlewares/requireDomain");
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
router.get('/_ah/warmup', (__, res, next) => {
    try {
        res.send('warmup done!');
    }
    catch (error) {
        next(error);
    }
});
router.use('/health', health_1.healthRouter);
// requireDomain(2023-10-06)
router.use(requireDomain_1.requireDomain);
router.use('/cron', cron_1.cronRouter);
// 認証
router.use(authentication_1.authentication);
router.use('/accountTransactions', accountTransactions_1.accountTransactionsRouter);
router.use('/permits', permits_1.permitsRouter);
