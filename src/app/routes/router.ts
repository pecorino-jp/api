/**
 * ルーター
 */
import * as express from 'express';

import { healthRouter } from './health';
import { ahRouter } from './_ah';

import { accountTransactionsRouter } from './accountTransactions';
import { permitsRouter } from './permits';

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
router.use('/health', healthRouter);

// 認証
router.use(authentication);

router.use('/accountTransactions', accountTransactionsRouter);
router.use('/permits', permitsRouter);

export { router };
