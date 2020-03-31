/**
 * 成立入金取引監視
 */
import * as pecorino from '@pecorino/domain';
import * as createDebug from 'debug';

import { connectMongo } from '../../../connectMongo';

const debug = createDebug('pecorino-api:jobs');

export default async () => {
    const connection = await connectMongo({ defaultConnection: false });

    let countExecute = 0;

    const MAX_NUBMER_OF_PARALLEL_TASKS = 10;
    const INTERVAL_MILLISECONDS = 100;
    const taskRepo = new pecorino.repository.Task(connection);
    const transactionRepo = new pecorino.repository.Transaction(connection);

    setInterval(
        async () => {
            if (countExecute > MAX_NUBMER_OF_PARALLEL_TASKS) {
                return;
            }

            countExecute += 1;

            try {
                debug('exporting tasks...');
                await pecorino.service.transaction.exportTasks({
                    status: pecorino.factory.transactionStatusType.Confirmed,
                    typeOf: pecorino.factory.transactionType.Deposit
                })({ task: taskRepo, transaction: transactionRepo });
            } catch (error) {
                // tslint:disable-next-line:no-console
                console.error(error);
            }

            countExecute -= 1;
        },
        INTERVAL_MILLISECONDS
    );
};
