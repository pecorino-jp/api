/**
 * 期限切れ取引監視
 */
import * as pecorino from '@pecorino/domain';

import { connectMongo } from '../../../connectMongo';

export default async () => {
    const connection = await connectMongo({ defaultConnection: false });

    let countExecute = 0;

    const MAX_NUBMER_OF_PARALLEL_TASKS = 10;
    const INTERVAL_MILLISECONDS = 100;
    const taskRepo = new pecorino.repository.Task(connection);
    const transactionRepo = new pecorino.repository.AccountTransaction(connection);

    setInterval(
        async () => {
            if (countExecute > MAX_NUBMER_OF_PARALLEL_TASKS) {
                return;
            }

            countExecute += 1;

            try {
                await pecorino.service.accountTransaction.exportTasks({
                    status: pecorino.factory.transactionStatusType.Expired,
                    typeOf: pecorino.factory.account.transactionType.Withdraw
                })({ task: taskRepo, accountTransaction: transactionRepo });
            } catch (error) {
                // tslint:disable-next-line:no-console
                console.error(error);
            }

            countExecute -= 1;
        },
        INTERVAL_MILLISECONDS
    );
};
