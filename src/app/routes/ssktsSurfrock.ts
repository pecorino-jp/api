/**
 * ssktsSurfockルーター
 */
import * as express from 'express';

import { authRouter } from './ssktsSurfrock/auth';
import { seatRouter } from './ssktsSurfrock/seat';

const ssktsSurfrockRouter = express.Router();

ssktsSurfrockRouter.use('/auth', authRouter);
ssktsSurfrockRouter.use('/seat', seatRouter);

export { ssktsSurfrockRouter };
