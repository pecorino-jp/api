import { chevre } from '@chevre/domain';
import * as moment from 'moment';
import * as util from 'util';

import * as redis from '../../../../redis';

export function createRefundIdentifier(params: {
    project: { id: string };
    paymentMethodId: string;
}) {
    return util.format(
        '%s:%s:%s',
        params.project.id,
        'refund',
        params.paymentMethodId
    );
}

// tslint:disable-next-line:max-func-body-length
function depositPoint(params: {
    project: { id: string };
    transactionNumber: string;
    sellerName: string;
    recipientName: string;
    issuedThrough: { id: string };
}) {
    // tslint:disable-next-line:max-func-body-length
    return async (repos: {
        account: chevre.repository.Account;
        accountTransaction: chevre.repository.AccountTransaction;
    }) => {
        const searchWithdrawTransactionResult = await repos.accountTransaction.search({
            limit: 1,
            page: 1,
            project: { id: { $eq: params.project.id } },
            transactionNumber: { $eq: params.transactionNumber },
            typeOf: { $eq: chevre.factory.account.transactionType.Withdraw }
        });
        const withdrawTransaction =
            <chevre.factory.account.transaction.ITransaction<chevre.factory.account.transactionType.Withdraw> | undefined>
            searchWithdrawTransactionResult.shift();
        if (withdrawTransaction !== undefined) {
            if (withdrawTransaction.status === chevre.factory.transactionStatusType.Confirmed) {
                // 返金のユニークネスを保証するため識別子を指定する
                const accountTransactionIdentifier = createRefundIdentifier({
                    project: { id: params.project.id },
                    paymentMethodId: params.transactionNumber
                });

                // すでに返金済かどうか確認
                let confirmedAccountTransactionNumber: string | undefined;
                if (typeof accountTransactionIdentifier === 'string') {
                    // 口座取引で確認する
                    const searchAccountTransactionsResult = await repos.accountTransaction.search({
                        limit: 100,
                        project: { id: { $eq: params.project.id } },
                        identifier: { $eq: accountTransactionIdentifier }
                    });
                    const existingAccountTransactions = searchAccountTransactionsResult;
                    for (const existingAccountTransaction of existingAccountTransactions) {
                        if (existingAccountTransaction.status === chevre.factory.transactionStatusType.Confirmed) {
                            confirmedAccountTransactionNumber = existingAccountTransaction.transactionNumber;
                        } else {
                            const accountTransaction =
                                await repos.accountTransaction.cancel({ transactionNumber: existingAccountTransaction.transactionNumber });

                            await chevre.service.account.cancelMoneyTransfer({
                                transaction: {
                                    typeOf: accountTransaction.typeOf,
                                    id: accountTransaction.id
                                }
                            })({
                                account: repos.account,
                                accountTransaction: repos.accountTransaction
                            });
                        }
                    }
                }

                if (typeof confirmedAccountTransactionNumber === 'string') {
                    // 念のためconfirm
                    const accountTransaction = await chevre.service.accountTransaction.confirm({
                        transactionNumber: confirmedAccountTransactionNumber
                    })({ accountTransaction: repos.accountTransaction });

                    const moneyTransferActionAttributes = accountTransaction.potentialActions?.moneyTransfer;
                    if (typeof moneyTransferActionAttributes?.typeOf !== 'string') {
                        throw new chevre.factory.errors.ServiceUnavailable('potentialActions undefined');
                    }

                    await chevre.service.account.transferMoney(moneyTransferActionAttributes)({
                        account: repos.account
                    });
                } else {
                    // depositTransactionNumber発行
                    const transactionNumberRepo = new chevre.repository.TransactionNumber(redis.getClient());
                    const publishDepositTransactionNumberResult = await transactionNumberRepo.publishByTimestamp({ startDate: new Date() });
                    const depositTransactionNumber = publishDepositTransactionNumberResult.transactionNumber;

                    await chevre.service.accountTransaction.deposit.start({
                        project: { id: params.project.id, typeOf: chevre.factory.organizationType.Project },
                        typeOf: chevre.factory.account.transactionType.Deposit,
                        identifier: accountTransactionIdentifier,
                        transactionNumber: depositTransactionNumber,
                        agent: {
                            name: params.sellerName,
                            typeOf: chevre.factory.organizationType.Corporation
                        },
                        recipient: {
                            name: params.recipientName,
                            typeOf: chevre.factory.personType.Person
                        },
                        object: {
                            amount: { value: withdrawTransaction.object.amount.value },
                            description: `Refund [${withdrawTransaction.object.description}]`,
                            toLocation: { accountNumber: withdrawTransaction.object.fromLocation.accountNumber }
                        },
                        expires: moment()
                            .add(1, 'minutes')
                            .toDate()
                    })({
                        account: repos.account,
                        accountTransaction: repos.accountTransaction
                    });

                    try {
                        const accountTransaction = await chevre.service.accountTransaction.confirm({
                            transactionNumber: depositTransactionNumber
                        })({ accountTransaction: repos.accountTransaction });

                        const moneyTransferActionAttributes = accountTransaction.potentialActions?.moneyTransfer;
                        if (typeof moneyTransferActionAttributes?.typeOf !== 'string') {
                            throw new chevre.factory.errors.ServiceUnavailable('potentialActions undefined');
                        }

                        await chevre.service.account.transferMoney(moneyTransferActionAttributes)({
                            account: repos.account
                        });
                    } catch (error) {
                        const accountTransaction =
                            await repos.accountTransaction.cancel({ transactionNumber: depositTransactionNumber });

                        await chevre.service.account.cancelMoneyTransfer({
                            transaction: {
                                typeOf: accountTransaction.typeOf,
                                id: accountTransaction.id
                            }
                        })({
                            account: repos.account,
                            accountTransaction: repos.accountTransaction
                        });

                        throw error;
                    }
                }
            } else {
                const accountTransaction =
                    await repos.accountTransaction.cancel({ transactionNumber: params.transactionNumber });

                await chevre.service.account.cancelMoneyTransfer({
                    transaction: {
                        typeOf: accountTransaction.typeOf,
                        id: accountTransaction.id
                    }
                })({
                    account: repos.account,
                    accountTransaction: repos.accountTransaction
                });
            }
        }
    };
}

export { depositPoint };
