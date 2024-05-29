"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express = require("express");
const health_1 = require("./health");
const accountTransactions_1 = require("./accountTransactions");
const cron_1 = require("./cron");
const permits_1 = require("./permits");
const authentication_1 = require("../middlewares/authentication");
const requireDomain_1 = require("../middlewares/requireDomain");
const router = express.Router();
exports.router = router;
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
router.use(requireDomain_1.requireDomain);
router.use('/cron', cron_1.cronRouter);
router.use(authentication_1.authentication);
router.use('/accountTransactions', accountTransactions_1.accountTransactionsRouter);
router.use('/permits', permits_1.permitsRouter);
