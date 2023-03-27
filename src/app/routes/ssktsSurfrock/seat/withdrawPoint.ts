import { chevre } from '@chevre/domain';
import * as moment from 'moment';

const PECORINO_ENDPOINT = String(process.env.PECORINO_ENDPOINT);
const PECORINO_AUTHORIZE_SERVER_DOMAIN = String(process.env.PECORINO_AUTHORIZE_SERVER_DOMAIN);
const PECORINO_CLIENT_ID = String(process.env.PECORINO_CLIENT_ID);
const PECORINO_CLIENT_SECRET = String(process.env.PECORINO_CLIENT_SECRET);
const DESCRIPTIONS_SEPARATOR = ',';

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

async function withdrawPoint(params: {
    project: { id: string };
    amount: number;
    transactionNumber: string;
    accountNumber: string;
    withdrawDescriptions: string[];
    sellerName: string;
}) {
    await accountTransactionService.start({
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
            .add(1, 'minutes')
            .toDate()
    });
    await accountTransactionService.confirmSync({ transactionNumber: params.transactionNumber });
}

export { withdrawPoint };
