/**
 * 非同期ジョブ
 */
import abortTasks from './continuous/abortTasks/run';
import makeTransactionExpired from './continuous/makeTransactionExpired/run';
import reexportTransactionTasks from './continuous/reexportTransactionTasks/run';
import retryTasks from './continuous/retryTasks/run';

export default async () => {
    await abortTasks();
    await makeTransactionExpired();
    await reexportTransactionTasks();
    await retryTasks();
};
