import { chevre } from '@chevre/domain';
import * as moment from 'moment';
import * as util from 'util';

import * as redis from '../../../../redis';

const PECORINO_ENDPOINT = String(process.env.PECORINO_ENDPOINT);
const PECORINO_AUTHORIZE_SERVER_DOMAIN = String(process.env.PECORINO_AUTHORIZE_SERVER_DOMAIN);
const PECORINO_CLIENT_ID = String(process.env.PECORINO_CLIENT_ID);
const PECORINO_CLIENT_SECRET = String(process.env.PECORINO_CLIENT_SECRET);

const accountTransactionService = new chevre.pecorinoapi.service.AccountTransaction({
    endpoint: PECORINO_ENDPOINT,
    auth: new chevre.pecorinoapi.auth.ClientCredentials({
        domain: PECORINO_AUTHORIZE_SERVER_DOMAIN,
        clientId: PECORINO_CLIENT_ID,
        clientSecret: PECORINO_CLIENT_SECRET,
        scopes: [],
        state: ''
    })
});

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

async function depositPoint(params: {
    project: { id: string };
    transactionNumber: string;
    sellerName: string;
    recipientName: string;
}) {
    const searchWithdrawTransactionResult = await accountTransactionService.search({
        limit: 1,
        page: 1,
        project: { id: { $eq: params.project.id } },
        transactionNumber: { $eq: params.transactionNumber },
        typeOf: { $eq: chevre.factory.account.transactionType.Withdraw }
    });
    const withdrawTransaction =
        <chevre.factory.account.transaction.ITransaction<chevre.factory.account.transactionType.Withdraw> | undefined>
        searchWithdrawTransactionResult.data.shift();
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
                const searchAccountTransactionsResult = await accountTransactionService.search({
                    limit: 100,
                    project: { id: { $eq: params.project.id } },
                    identifier: { $eq: accountTransactionIdentifier }
                });
                const existingAccountTransactions = searchAccountTransactionsResult.data;
                for (const existingAccountTransaction of existingAccountTransactions) {
                    if (existingAccountTransaction.status === chevre.factory.transactionStatusType.Confirmed) {
                        confirmedAccountTransactionNumber = existingAccountTransaction.transactionNumber;
                    } else {
                        await accountTransactionService.cancelSync({ transactionNumber: existingAccountTransaction.transactionNumber });
                    }
                }
            }

            if (typeof confirmedAccountTransactionNumber === 'string') {
                // 念のためconfirm
                await accountTransactionService.confirmSync({ transactionNumber: confirmedAccountTransactionNumber });
            } else {
                // depositTransactionNumber発行
                const transactionNumberRepo = new chevre.repository.TransactionNumber(redis.getClient());
                const publishDepositTransactionNumberResult = await transactionNumberRepo.publishByTimestamp({ startDate: new Date() });
                const depositTransactionNumber = publishDepositTransactionNumberResult.transactionNumber;

                await accountTransactionService.start({
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
                });

                try {
                    await accountTransactionService.confirmSync({ transactionNumber: depositTransactionNumber });
                } catch (error) {
                    await accountTransactionService.cancelSync({ transactionNumber: depositTransactionNumber });

                    throw error;
                }
            }
        } else {
            await accountTransactionService.cancelSync({ transactionNumber: params.transactionNumber });
        }
    }
}

export { depositPoint };
