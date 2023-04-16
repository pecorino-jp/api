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
exports.depositPoint = exports.createRefundIdentifier = void 0;
const domain_1 = require("@chevre/domain");
const moment = require("moment");
const util = require("util");
const redis_1 = require("../../../../redis");
const PECORINO_ENDPOINT = String(process.env.PECORINO_ENDPOINT);
const PECORINO_AUTHORIZE_SERVER_DOMAIN = String(process.env.PECORINO_AUTHORIZE_SERVER_DOMAIN);
const PECORINO_CLIENT_ID = String(process.env.PECORINO_CLIENT_ID);
const PECORINO_CLIENT_SECRET = String(process.env.PECORINO_CLIENT_SECRET);
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
function createRefundIdentifier(params) {
    return util.format('%s:%s:%s', params.project.id, 'refund', params.paymentMethodId);
}
exports.createRefundIdentifier = createRefundIdentifier;
function depositPoint(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchWithdrawTransactionResult = yield accountTransactionService.search({
            limit: 1,
            page: 1,
            project: { id: { $eq: params.project.id } },
            transactionNumber: { $eq: params.transactionNumber },
            typeOf: { $eq: domain_1.chevre.factory.account.transactionType.Withdraw }
        });
        const withdrawTransaction = searchWithdrawTransactionResult.data.shift();
        if (withdrawTransaction !== undefined) {
            if (withdrawTransaction.status === domain_1.chevre.factory.transactionStatusType.Confirmed) {
                // 返金のユニークネスを保証するため識別子を指定する
                const accountTransactionIdentifier = createRefundIdentifier({
                    project: { id: params.project.id },
                    paymentMethodId: params.transactionNumber
                });
                // すでに返金済かどうか確認
                let confirmedAccountTransactionNumber;
                if (typeof accountTransactionIdentifier === 'string') {
                    // 口座取引で確認する
                    const searchAccountTransactionsResult = yield accountTransactionService.search({
                        limit: 100,
                        project: { id: { $eq: params.project.id } },
                        identifier: { $eq: accountTransactionIdentifier }
                    });
                    const existingAccountTransactions = searchAccountTransactionsResult.data;
                    for (const existingAccountTransaction of existingAccountTransactions) {
                        if (existingAccountTransaction.status === domain_1.chevre.factory.transactionStatusType.Confirmed) {
                            confirmedAccountTransactionNumber = existingAccountTransaction.transactionNumber;
                        }
                        else {
                            yield accountTransactionService.cancelSync({ transactionNumber: existingAccountTransaction.transactionNumber });
                        }
                    }
                }
                if (typeof confirmedAccountTransactionNumber === 'string') {
                    // 念のためconfirm
                    yield accountTransactionService.confirmSync({ transactionNumber: confirmedAccountTransactionNumber });
                }
                else {
                    // depositTransactionNumber発行
                    const transactionNumberRepo = new domain_1.chevre.repository.TransactionNumber(redis_1.redisClient);
                    const publishDepositTransactionNumberResult = yield transactionNumberRepo.publishByTimestamp({ startDate: new Date() });
                    const depositTransactionNumber = publishDepositTransactionNumberResult.transactionNumber;
                    yield accountTransactionService.start({
                        project: { id: params.project.id, typeOf: domain_1.chevre.factory.organizationType.Project },
                        typeOf: domain_1.chevre.factory.account.transactionType.Deposit,
                        identifier: accountTransactionIdentifier,
                        transactionNumber: depositTransactionNumber,
                        agent: {
                            name: params.sellerName,
                            typeOf: domain_1.chevre.factory.organizationType.Corporation
                        },
                        recipient: {
                            name: params.recipientName,
                            typeOf: domain_1.chevre.factory.personType.Person
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
                        yield accountTransactionService.confirmSync({ transactionNumber: depositTransactionNumber });
                    }
                    catch (error) {
                        yield accountTransactionService.cancelSync({ transactionNumber: depositTransactionNumber });
                        throw error;
                    }
                }
            }
            else {
                yield accountTransactionService.cancelSync({ transactionNumber: params.transactionNumber });
            }
        }
    });
}
exports.depositPoint = depositPoint;
