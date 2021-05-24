/**
 * 期限切れ入金取引監視
 */
import * as chevre from '@chevre/domain';

import { connectMongo } from '../../../connectMongo';

export default async () => {
    const connection = await connectMongo({ defaultConnection: false });

    let countExecute = 0;

    const MAX_NUBMER_OF_PARALLEL_TASKS = 10;
    const INTERVAL_MILLISECONDS = 100;
    const taskRepo = new chevre.repository.Task(connection);
    const transactionRepo = new chevre.repository.AccountTransaction(connection);

    setInterval(
        async () => {
            if (countExecute > MAX_NUBMER_OF_PARALLEL_TASKS) {
                return;
            }

            countExecute += 1;

            try {
                await chevre.service.accountTransaction.exportTasks({
                    status: chevre.factory.transactionStatusType.Expired,
                    typeOf: chevre.factory.account.transactionType.Deposit
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
