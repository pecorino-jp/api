/**
 * 非同期ジョブ
 */
import abortTasks from './continuous/abortTasks/run';
import makeTransactionExpired from './continuous/makeTransactionExpired/run';
import reexportTransactionTasks from './continuous/reexportTransactionTasks/run';
import retryTasks from './continuous/retryTasks/run';

import cancelMoneyTransfer from './continuous/cancelMoneyTransfer/run';
import moneyTransfer from './continuous/moneyTransfer/run';

import onDepositCanceled from './continuous/onDepositCanceled/run';
import onDepositConfirmed from './continuous/onDepositConfirmed/run';
import onDepositExpired from './continuous/onDepositExpired/run';
import onTransferCanceled from './continuous/onTransferCanceled/run';
import onTransferConfirmed from './continuous/onTransferConfirmed/run';
import onTransferExpired from './continuous/onTransferExpired/run';
import onWithdrawCanceled from './continuous/onWithdrawCanceled/run';
import onWithdrawConfirmed from './continuous/onWithdrawConfirmed/run';
import onWithdrawExpired from './continuous/onWithdrawExpired/run';

export default async () => {
    await abortTasks();
    await makeTransactionExpired();
    await reexportTransactionTasks();
    await retryTasks();

    await cancelMoneyTransfer();
    await moneyTransfer();

    await onDepositCanceled();
    await onDepositConfirmed();
    await onDepositExpired();
    await onTransferCanceled();
    await onTransferConfirmed();
    await onTransferExpired();
    await onWithdrawCanceled();
    await onWithdrawConfirmed();
    await onWithdrawExpired();
};
