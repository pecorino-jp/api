/**
 * ssktsMembershipCouponルーター
 */
import * as express from 'express';

import { authRouter } from './ssktsMembershipCoupon/auth';
import { seatRouter } from './ssktsMembershipCoupon/seat';

const ssktsMembershipCouponRouter = express.Router();

ssktsMembershipCouponRouter.use('/auth', authRouter);
ssktsMembershipCouponRouter.use('/seat', seatRouter);

export { ssktsMembershipCouponRouter };
