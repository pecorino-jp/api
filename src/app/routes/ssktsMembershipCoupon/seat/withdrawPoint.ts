import { chevre } from '@chevre/domain';
import * as moment from 'moment';

const DESCRIPTIONS_SEPARATOR = ',';

function withdrawPoint(params: {
    project: { id: string };
    amount: number;
    transactionNumber: string;
    accountNumber: string;
    withdrawDescriptions: string[];
    sellerName: string;
    issuedThrough: { id: string };
}) {
    return async (repos: {
        account: chevre.repository.Account;
        accountTransaction: chevre.repository.AccountTransaction;
    }) => {
        // 冪等性確保
        const searchWithdrawTransactionResult = await repos.accountTransaction.search({
            limit: 1,
            page: 1,
            project: { id: { $eq: params.project.id } },
            transactionNumber: { $eq: params.transactionNumber },
            typeOf: { $eq: chevre.factory.account.transactionType.Withdraw }
        });
        const withdrawTransaction = searchWithdrawTransactionResult.shift();

        // 口座取引未開始であれば開始
        if (withdrawTransaction === undefined) {
            await chevre.service.accountTransaction.withdraw.start({
                project: { id: params.project.id, typeOf: chevre.factory.organizationType.Project },
                typeOf: chevre.factory.account.transactionType.Withdraw,
                // identifier?: string;
                transactionNumber: params.transactionNumber,
                agent: {
                    name: params.sellerName,
                    typeOf: chevre.factory.organizationType.Corporation
                },
                recipient: {
                    name: params.sellerName,
                    typeOf: chevre.factory.organizationType.Corporation
                },
                object: {
                    amount: { value: params.amount },
                    description: String(params.withdrawDescriptions.join(DESCRIPTIONS_SEPARATOR)),
                    fromLocation: { accountNumber: params.accountNumber }
                },
                expires: moment()
                    .add(1, 'months') // 期限切れしないように十分に長く
                    .toDate()
            })({
                account: repos.account,
                accountTransaction: repos.accountTransaction
            });
        }

        const accountTransaction = await chevre.service.accountTransaction.confirm({
            transactionNumber: params.transactionNumber
        })({ accountTransaction: repos.accountTransaction });

        const moneyTransferActionAttributes = accountTransaction.potentialActions?.moneyTransfer;
        if (typeof moneyTransferActionAttributes?.typeOf !== 'string') {
            throw new chevre.factory.errors.ServiceUnavailable('potentialActions undefined');
        }

        await chevre.service.account.transferMoney(moneyTransferActionAttributes)({
            account: repos.account
        });
    };
}

export { withdrawPoint };
