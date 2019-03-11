/**
 * 非同期ジョブ
 */
import abortTasks from './continuous/abortTasks/run';
import makeTransactionExpired from './continuous/makeTransactionExpired/run';
import reexportTransactionTasks from './continuous/reexportTransactionTasks/run';
import retryTasks from './continuous/retryTasks/run';

import cancelMoneyTransfer from './continuous/cancelMoneyTransfer/run';
import moneyTransfer from './continuous/moneyTransfer/run';

import onCanceledDepositTransaction from './continuous/onCanceledDepositTransaction/run';
import onCanceledTransferTransaction from './continuous/onCanceledTransferTransaction/run';
import onCanceledWithdrawTransaction from './continuous/onCanceledWithdrawTransaction/run';
import onConfirmedDepositTransaction from './continuous/onConfirmedDepositTransaction/run';
import onConfirmedTransferTransaction from './continuous/onConfirmedTransferTransaction/run';
import onConfirmedWithdrawTransaction from './continuous/onConfirmedWithdrawTransaction/run';
import onExpiredDepositTransaction from './continuous/onExpiredDepositTransaction/run';
import onExpiredTransferTransaction from './continuous/onExpiredTransferTransaction/run';
import onExpiredWithdrawTransaction from './continuous/onExpiredWithdrawTransaction/run';

export default async () => {
    await abortTasks();
    await makeTransactionExpired();
    await reexportTransactionTasks();
    await retryTasks();

    await cancelMoneyTransfer();
    await moneyTransfer();

    await onCanceledDepositTransaction();
    await onCanceledTransferTransaction();
    await onCanceledWithdrawTransaction();
    await onConfirmedDepositTransaction();
    await onConfirmedTransferTransaction();
    await onConfirmedWithdrawTransaction();
    await onExpiredDepositTransaction();
    await onExpiredTransferTransaction();
    await onExpiredWithdrawTransaction();
};
