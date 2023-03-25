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
const redis = require("../../../../redis");
function createRefundIdentifier(params) {
    return util.format('%s:%s:%s', params.project.id, 'refund', params.paymentMethodId);
}
exports.createRefundIdentifier = createRefundIdentifier;
// tslint:disable-next-line:max-func-body-length
function depositPoint(params) {
    // tslint:disable-next-line:max-func-body-length
    return (repos) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const searchWithdrawTransactionResult = yield repos.accountTransaction.search({
            limit: 1,
            page: 1,
            project: { id: { $eq: params.project.id } },
            transactionNumber: { $eq: params.transactionNumber },
            typeOf: { $eq: domain_1.chevre.factory.account.transactionType.Withdraw }
        });
        const withdrawTransaction = searchWithdrawTransactionResult.shift();
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
                    const searchAccountTransactionsResult = yield repos.accountTransaction.search({
                        limit: 100,
                        project: { id: { $eq: params.project.id } },
                        identifier: { $eq: accountTransactionIdentifier }
                    });
                    const existingAccountTransactions = searchAccountTransactionsResult;
                    for (const existingAccountTransaction of existingAccountTransactions) {
                        if (existingAccountTransaction.status === domain_1.chevre.factory.transactionStatusType.Confirmed) {
                            confirmedAccountTransactionNumber = existingAccountTransaction.transactionNumber;
                        }
                        else {
                            const accountTransaction = yield repos.accountTransaction.cancel({ transactionNumber: existingAccountTransaction.transactionNumber });
                            yield domain_1.chevre.service.account.cancelMoneyTransfer({
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
                    const accountTransaction = yield domain_1.chevre.service.accountTransaction.confirm({
                        transactionNumber: confirmedAccountTransactionNumber
                    })({ accountTransaction: repos.accountTransaction });
                    const moneyTransferActionAttributes = (_a = accountTransaction.potentialActions) === null || _a === void 0 ? void 0 : _a.moneyTransfer;
                    if (typeof (moneyTransferActionAttributes === null || moneyTransferActionAttributes === void 0 ? void 0 : moneyTransferActionAttributes.typeOf) !== 'string') {
                        throw new domain_1.chevre.factory.errors.ServiceUnavailable('potentialActions undefined');
                    }
                    yield domain_1.chevre.service.account.transferMoney(moneyTransferActionAttributes)({
                        account: repos.account
                    });
                }
                else {
                    // depositTransactionNumber発行
                    const transactionNumberRepo = new domain_1.chevre.repository.TransactionNumber(redis.getClient());
                    const publishDepositTransactionNumberResult = yield transactionNumberRepo.publishByTimestamp({ startDate: new Date() });
                    const depositTransactionNumber = publishDepositTransactionNumberResult.transactionNumber;
                    yield domain_1.chevre.service.accountTransaction.deposit.start({
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
                    })({
                        account: repos.account,
                        accountTransaction: repos.accountTransaction
                    });
                    try {
                        const accountTransaction = yield domain_1.chevre.service.accountTransaction.confirm({
                            transactionNumber: depositTransactionNumber
                        })({ accountTransaction: repos.accountTransaction });
                        const moneyTransferActionAttributes = (_b = accountTransaction.potentialActions) === null || _b === void 0 ? void 0 : _b.moneyTransfer;
                        if (typeof (moneyTransferActionAttributes === null || moneyTransferActionAttributes === void 0 ? void 0 : moneyTransferActionAttributes.typeOf) !== 'string') {
                            throw new domain_1.chevre.factory.errors.ServiceUnavailable('potentialActions undefined');
                        }
                        yield domain_1.chevre.service.account.transferMoney(moneyTransferActionAttributes)({
                            account: repos.account
                        });
                    }
                    catch (error) {
                        const accountTransaction = yield repos.accountTransaction.cancel({ transactionNumber: depositTransactionNumber });
                        yield domain_1.chevre.service.account.cancelMoneyTransfer({
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
            }
            else {
                const accountTransaction = yield repos.accountTransaction.cancel({ transactionNumber: params.transactionNumber });
                yield domain_1.chevre.service.account.cancelMoneyTransfer({
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
    });
}
exports.depositPoint = depositPoint;
