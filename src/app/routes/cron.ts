/**
 * cronルーター
 */
import { chevre } from '@chevre/domain';
import * as express from 'express';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

const ACCOUNT_TRANSACTION_STORAGE_PERIOD_IN_MONTH = (typeof process.env.ACCOUNT_TRANSACTION_STORAGE_PERIOD_IN_MONTH === 'string')
    ? Number(process.env.ACCOUNT_TRANSACTION_STORAGE_PERIOD_IN_MONTH)
    // tslint:disable-next-line:no-magic-numbers
    : 12;

const cronRouter = express.Router();

cronRouter.get(
    '/cleanUpDatabase',
    async (_, res, next) => {
        try {
            const now = new Date();
            const accountTransactionRepo = new chevre.repository.AccountTransaction(mongoose.connection);

            try {
                await accountTransactionRepo.clean({
                    // 終了日時を一定期間過ぎたもの
                    endDate: {
                        $lt: moment(now)
                            .add(-ACCOUNT_TRANSACTION_STORAGE_PERIOD_IN_MONTH, 'months')
                            .toDate()
                    }
                });
            } catch (error) {
                // tslint:disable-next-line:no-console
                console.error('accountActionRepo.clean or accountTransactionRepo.clean throws', error);
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export { cronRouter };
