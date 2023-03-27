"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ssktsMembershipCouponRouter = void 0;
/**
 * ssktsMembershipCouponルーター
 */
const express = require("express");
const auth_1 = require("./ssktsMembershipCoupon/auth");
const seat_1 = require("./ssktsMembershipCoupon/seat");
const ssktsMembershipCouponRouter = express.Router();
exports.ssktsMembershipCouponRouter = ssktsMembershipCouponRouter;
ssktsMembershipCouponRouter.use('/auth', auth_1.authRouter);
ssktsMembershipCouponRouter.use('/seat', seat_1.seatRouter);
