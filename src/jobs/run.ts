/**
 * 非同期ジョブ
 */
import { abortTasks } from './continuous/abortTasks/run';
import { makeTransactionExpired } from './continuous/makeTransactionExpired/run';
import { reexportTransactionTasks } from './continuous/reexportTransactionTasks/run';
import { retryTasks } from './continuous/retryTasks/run';

import { accountMoneyTransfer } from './continuous/accountMoneyTransfer/run';
import { cancelAccountMoneyTransfer } from './continuous/cancelAccountMoneyTransfer/run';

import { onAccountTransactionCanceled } from './continuous/onAccountTransactionCanceled/run';
import { onAccountTransactionConfirmed } from './continuous/onAccountTransactionConfirmed/run';
import { onAccountTransactionExpired } from './continuous/onAccountTransactionExpired/run';

export async function runJobs() {
    await abortTasks();
    await makeTransactionExpired();
    await reexportTransactionTasks();
    await retryTasks();

    await accountMoneyTransfer();
    await cancelAccountMoneyTransfer();

    await onAccountTransactionCanceled();
    await onAccountTransactionConfirmed();
    await onAccountTransactionExpired();
}
