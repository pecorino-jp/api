"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawPoint = void 0;
const domain_1 = require("@chevre/domain");
const moment = require("moment");
const PECORINO_ENDPOINT = String(process.env.PECORINO_ENDPOINT);
const PECORINO_AUTHORIZE_SERVER_DOMAIN = String(process.env.PECORINO_AUTHORIZE_SERVER_DOMAIN);
const PECORINO_CLIENT_ID = String(process.env.PECORINO_CLIENT_ID);
const PECORINO_CLIENT_SECRET = String(process.env.PECORINO_CLIENT_SECRET);
const DESCRIPTIONS_SEPARATOR = ',';
const accountTransactionService = new domain_1.chevre.pecorinoapi.service.AccountTransaction({
    endpoint: PECORINO_ENDPOINT,
    auth: new domain_1.chevre.pecorinoapi.auth.ClientCredentials({
        domain: PECORINO_AUTHORIZE_SERVER_DOMAIN,
        clientId: PECORINO_CLIENT_ID,
        clientSecret: PECORINO_CLIENT_SECRET,
        scopes: [],
        state: ''
    })
});
function withdrawPoint(params) {
    return __awaiter(this, void 0, void 0, function* () {
        yield accountTransactionService.start({
            project: { id: params.project.id, typeOf: domain_1.chevre.factory.organizationType.Project },
            typeOf: domain_1.chevre.factory.account.transactionType.Withdraw,
            // identifier?: string;
            transactionNumber: params.transactionNumber,
            agent: {
                name: params.sellerName,
                typeOf: domain_1.chevre.factory.organizationType.Corporation
            },
            recipient: {
                name: params.sellerName,
                typeOf: domain_1.chevre.factory.organizationType.Corporation
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
        yield accountTransactionService.confirmSync({ transactionNumber: params.transactionNumber });
    });
}
exports.withdrawPoint = withdrawPoint;
