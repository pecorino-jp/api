"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ssktsSurfrockRouter = void 0;
/**
 * ssktsSurfockルーター
 */
const express = require("express");
const auth_1 = require("./ssktsSurfrock/auth");
const seat_1 = require("./ssktsSurfrock/seat");
const ssktsSurfrockRouter = express.Router();
exports.ssktsSurfrockRouter = ssktsSurfrockRouter;
ssktsSurfrockRouter.use('/auth', auth_1.authRouter);
ssktsSurfrockRouter.use('/seat', seat_1.seatRouter);
