"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ルーター
 */
const express = require("express");
const health_1 = require("./health");
const _ah_1 = require("./_ah");
const accountActions_1 = require("./accountActions");
const accounts_1 = require("./accounts");
const deposit_1 = require("./accountTransactions/deposit");
const transfer_1 = require("./accountTransactions/transfer");
const withdraw_1 = require("./accountTransactions/withdraw");
const authentication_1 = require("../middlewares/authentication");
const router = express.Router();
// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })
router.use('/_ah', _ah_1.default);
router.use('/health', health_1.default);
// 認証
router.use(authentication_1.default);
router.use('/accounts/Default', accounts_1.default);
router.use('/accounts', accounts_1.default);
router.use('/actions', accountActions_1.default);
router.use('/transactions/deposit', deposit_1.default);
router.use('/transactions/withdraw', withdraw_1.default);
router.use('/transactions/transfer', transfer_1.default);
exports.default = router;
