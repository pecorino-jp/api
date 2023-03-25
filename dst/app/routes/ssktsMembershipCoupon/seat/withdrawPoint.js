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
const DESCRIPTIONS_SEPARATOR = ',';
function withdrawPoint(params) {
    return (repos) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        // 冪等性確保
        const searchWithdrawTransactionResult = yield repos.accountTransaction.search({
            limit: 1,
            page: 1,
            project: { id: { $eq: params.project.id } },
            transactionNumber: { $eq: params.transactionNumber },
            typeOf: { $eq: domain_1.chevre.factory.account.transactionType.Withdraw }
        });
        const withdrawTransaction = searchWithdrawTransactionResult.shift();
        // 口座取引未開始であれば開始
        if (withdrawTransaction === undefined) {
            yield domain_1.chevre.service.accountTransaction.withdraw.start({
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
                    .add(1, 'months') // 期限切れしないように十分に長く
                    .toDate()
            })({
                account: repos.account,
                accountTransaction: repos.accountTransaction
            });
        }
        const accountTransaction = yield domain_1.chevre.service.accountTransaction.confirm({
            transactionNumber: params.transactionNumber
        })({ accountTransaction: repos.accountTransaction });
        const moneyTransferActionAttributes = (_a = accountTransaction.potentialActions) === null || _a === void 0 ? void 0 : _a.moneyTransfer;
        if (typeof (moneyTransferActionAttributes === null || moneyTransferActionAttributes === void 0 ? void 0 : moneyTransferActionAttributes.typeOf) !== 'string') {
            throw new domain_1.chevre.factory.errors.ServiceUnavailable('potentialActions undefined');
        }
        yield domain_1.chevre.service.account.transferMoney(moneyTransferActionAttributes)({
            account: repos.account
        });
    });
}
exports.withdrawPoint = withdrawPoint;
