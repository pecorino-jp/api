"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ルーター
 */
const express = require("express");
const accounts_1 = require("./accounts");
const actions_1 = require("./actions");
const dev_1 = require("./dev");
const health_1 = require("./health");
const deposit_1 = require("./transactions/deposit");
const transfer_1 = require("./transactions/transfer");
const withdraw_1 = require("./transactions/withdraw");
const router = express.Router();
// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })
router.use('/accounts', accounts_1.default);
router.use('/actions', actions_1.default);
router.use('/health', health_1.default);
router.use('/transactions/deposit', deposit_1.default);
router.use('/transactions/withdraw', withdraw_1.default);
router.use('/transactions/transfer', transfer_1.default);
// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
    router.use('/dev', dev_1.default);
}
exports.default = router;
