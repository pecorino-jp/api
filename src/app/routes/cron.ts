/**
 * cronルーター
 */
import { chevre } from '@cinerino/domain';
import * as express from 'express';
import { NO_CONTENT } from 'http-status';
// import * as moment from 'moment';
import * as mongoose from 'mongoose';

const cronRouter = express.Router();

cronRouter.get(
    '/cleanUpDatabase',
    async (_, res, next) => {
        try {
            // const now = new Date();
            // const actionRepo = new chevre.repository.Action(mongoose.connection);

            // // actions
            // try {
            //     await actionRepo.deleteEndDatePassedCertainPeriod({
            //         $lt: moment(now)
            //             // tslint:disable-next-line:no-magic-numbers
            //             .add(-24, 'months')
            //             .toDate()
            //     });
            // } catch (error) {
            //     // tslint:disable-next-line:no-console
            //     console.error('actionRepo.deleteEndDatePassedCertainPeriod throws', error);
            // }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

cronRouter.get(
    '/makeTransactionExpires',
    async (_, res, next) => {
        try {
            const now = new Date();

            const accountTransactionRepo = new chevre.repository.AccountTransaction(mongoose.connection);

            await accountTransactionRepo.makeExpired({ expires: now });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

const REEXPORT_TRANSACTION_TASK_INTERVAL_MINUTES = 10;

cronRouter.get(
    '/reexportTransactionTasks',
    async (_, res, next) => {
        try {
            const accountTransactionRepo = new chevre.repository.AccountTransaction(mongoose.connection);

            await accountTransactionRepo.reexportTasks({ intervalInMinutes: REEXPORT_TRANSACTION_TASK_INTERVAL_MINUTES });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export { cronRouter };
