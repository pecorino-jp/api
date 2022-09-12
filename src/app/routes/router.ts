/**
 * ルーター
 */
import * as express from 'express';

import { healthRouter } from './health';
import { ahRouter } from './_ah';

// import accountActionsRouter from './accountActions';
// import accountsRouter from './accounts';
import { depositTransactionsRouter } from './accountTransactions/deposit';
import { transferTransactionsRouter } from './accountTransactions/transfer';
import { withdrawTransactionsRouter } from './accountTransactions/withdraw';
import { permitsRouter } from './permits';

import { authentication } from '../middlewares/authentication';

const router = express.Router();

// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })

router.use('/_ah', ahRouter);
router.use('/health', healthRouter);

// 認証
router.use(authentication);

// router.use('/accounts', accountsRouter);
// router.use('/actions', accountActionsRouter);
router.use('/transactions/deposit', depositTransactionsRouter);
router.use('/transactions/withdraw', withdrawTransactionsRouter);
router.use('/transactions/transfer', transferTransactionsRouter);
router.use('/permits', permitsRouter);

export { router };
