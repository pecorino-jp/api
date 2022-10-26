/**
 * 非同期ジョブ
 */
// import { makeTransactionExpired } from './continuous/makeTransactionExpired/run';
// import { reexportTransactionTasks } from './continuous/reexportTransactionTasks/run';

import { accountMoneyTransfer } from './continuous/accountMoneyTransfer/run';
import { cancelAccountMoneyTransfer } from './continuous/cancelAccountMoneyTransfer/run';

import { onAccountTransactionCanceled } from './continuous/onAccountTransactionCanceled/run';
import { onAccountTransactionConfirmed } from './continuous/onAccountTransactionConfirmed/run';
import { onAccountTransactionExpired } from './continuous/onAccountTransactionExpired/run';

const USE_EXPORT_TRANSACTION_TASKS = process.env.USE_EXPORT_TRANSACTION_TASKS === '1';

export async function runJobs() {
    // await makeTransactionExpired();
    // await reexportTransactionTasks();

    if (USE_EXPORT_TRANSACTION_TASKS) {
        await accountMoneyTransfer();
        await cancelAccountMoneyTransfer();

        await onAccountTransactionCanceled();
        await onAccountTransactionConfirmed();
        await onAccountTransactionExpired();
    }
}
