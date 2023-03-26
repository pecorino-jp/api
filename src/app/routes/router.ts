/**
 * ルーター
 */
import * as express from 'express';

import { healthRouter } from './health';
import { ahRouter } from './_ah';

import { accountTransactionsRouter } from './accountTransactions';
import { cronRouter } from './cron';
import { permitsRouter } from './permits';
import { ssktsMembershipCouponRouter } from './ssktsMembershipCoupon';
import { ssktsSurfrockRouter } from './ssktsSurfrock';

import { authentication } from '../middlewares/authentication';

const router = express.Router();

// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })

router.get(
    '',
    (__, res) => {
        res.send('hello!');
    }
);
router.use('/_ah', ahRouter);
router.use('/cron', cronRouter);
router.use('/health', healthRouter);

// 認証
router.use(authentication);

router.use('/accountTransactions', accountTransactionsRouter);
router.use('/permits', permitsRouter);
router.use('/ssktsMembershipCoupon', ssktsMembershipCouponRouter);
router.use('/ssktsSurfrock', ssktsSurfrockRouter);

export { router };
