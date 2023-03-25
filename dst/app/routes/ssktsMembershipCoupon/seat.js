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
exports.seatRouter = void 0;
/**
 * 着券ルーター
 */
const domain_1 = require("@chevre/domain");
const express = require("express");
const mongoose = require("mongoose");
const permitScopes_1 = require("../../middlewares/permitScopes");
const auth_1 = require("./auth");
const depositPoint_1 = require("./seat/depositPoint");
const withdrawPoint_1 = require("./seat/withdrawPoint");
const OFFER_ADDITIONAL_PROPERTY_NAME_THEATER_CODE = 'theaterCode';
const OFFER_ADDITIONAL_PROPERTY_NAME_TICKET_CODE = 'ticketCode';
const WITHDRAW_DESCRIPTION_SUFFIX = ' 引換';
const seatRouter = express.Router();
exports.seatRouter = seatRouter;
seatRouter.post('/seatInfoSync', (0, permitScopes_1.permitScopes)(['admin']), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const accountRepo = new domain_1.chevre.repository.Account(mongoose.connection);
        const accountTransactionRepo = new domain_1.chevre.repository.AccountTransaction(mongoose.connection);
        const authorizationRepo = new domain_1.chevre.repository.Code(mongoose.connection);
        const offerRepo = new domain_1.chevre.repository.Offer(mongoose.connection);
        const ownershipInfoRepo = new domain_1.chevre.repository.OwnershipInfo(mongoose.connection);
        const sellerRepo = new domain_1.chevre.repository.Seller(mongoose.connection);
        const authParams = req.body;
        // 施設検索
        const { seller } = yield findSeller({
            authParams,
            project: { id: authParams.kgygishCd }
        })({ seller: sellerRepo });
        // knyknrNoは1つしかリクエストされない前提
        const permitIdentifier = authParams.knyknrNoInfo[0].knyknrNo;
        const ownershipInfoCode = authParams.knyknrNoInfo[0].pinCd; // 所有権コード
        const { membershipOwnershipInfo } = yield (0, auth_1.validateMembership)({
            project: { id: authParams.kgygishCd },
            permitIdentifier,
            ownershipInfoCode
        })({
            authorization: authorizationRepo,
            ownershipInfo: ownershipInfoRepo
        });
        const ownerId = Array.isArray(membershipOwnershipInfo.ownedBy)
            ? membershipOwnershipInfo.ownedBy[0].id
            : membershipOwnershipInfo.ownedBy.id;
        const { identifier, issuedThrough } = yield findPaymentCard({
            project: { id: authParams.kgygishCd },
            ownedBy: { id: ownerId },
            ownedTime: now
        })({ ownershipInfo: ownershipInfoRepo });
        if (authParams.trkshFlg === '0') {
            // メンバーシップを検証する
            const transactionNumber = authParams.kgygishSstmZskyykNo;
            const { unitPriceOffers } = yield searchAvailableUnitPriceOffers({
                authParams,
                project: { id: authParams.kgygishCd }
            })({ offer: offerRepo });
            const { pointAmount, withdrawDescriptions } = validateAuthParams({ authParams, unitPriceOffers });
            if (pointAmount > 0) {
                yield (0, withdrawPoint_1.withdrawPoint)({
                    project: { id: authParams.kgygishCd },
                    amount: pointAmount,
                    transactionNumber,
                    accountNumber: identifier,
                    withdrawDescriptions,
                    sellerName: String(seller.name.ja),
                    issuedThrough
                })({ account: accountRepo, accountTransaction: accountTransactionRepo });
            }
        }
        else {
            const transactionNumber = authParams.kgygishSstmZskyykNo;
            yield (0, depositPoint_1.depositPoint)({
                project: { id: authParams.kgygishCd },
                transactionNumber,
                sellerName: String(seller.name.ja),
                recipientName: permitIdentifier,
                issuedThrough
            })({ account: accountRepo, accountTransaction: accountTransactionRepo });
        }
        res.json({
            resultInfo: {
                status: 'N000',
                message: ''
            },
            zskyykResult: '01'
            // mkknyknrNoInfo: null
        });
    }
    catch (error) {
        next(error);
    }
}));
function findSeller(params) {
    return (repos) => __awaiter(this, void 0, void 0, function* () {
        const theaterCode = params.authParams.stCd;
        // 施設検索
        const sellers = yield repos.seller.search({
            limit: 1,
            page: 1,
            project: { id: { $eq: params.project.id } },
            branchCode: { $eq: theaterCode }
        }, {
            hasMerchantReturnPolicy: 0,
            makesOffer: 0,
            paymentAccepted: 0
        });
        const seller = sellers.shift();
        if (seller === undefined) {
            throw new domain_1.chevre.factory.errors.NotFound('Seller');
        }
        return { seller };
    });
}
function searchAvailableUnitPriceOffers(params) {
    return (repos) => __awaiter(this, void 0, void 0, function* () {
        const theaterCode = params.authParams.stCd;
        let uniqueTicketCodes = [];
        params.authParams.knyknrNoInfo.forEach((knyknrNoInfo) => {
            knyknrNoInfo.knshInfo.forEach((knshInfo) => {
                uniqueTicketCodes.push(knshInfo.knshTyp);
            });
        });
        uniqueTicketCodes = [...new Set(uniqueTicketCodes)];
        if (uniqueTicketCodes.length === 0) {
            throw new domain_1.chevre.factory.errors.ArgumentNull('knyknrNoInfo.knshInfo.knshTyp');
        }
        // 単価オファーを確認
        const unitPriceOffers = yield repos.offer.search({
            project: { id: { $eq: params.project.id } },
            additionalProperty: {
                $all: [
                    {
                        $elemMatch: {
                            name: { $eq: OFFER_ADDITIONAL_PROPERTY_NAME_THEATER_CODE }, value: { $in: [theaterCode] }
                        }
                    },
                    {
                        // 指定されたticketCodeのみ検索する
                        $elemMatch: {
                            name: { $eq: OFFER_ADDITIONAL_PROPERTY_NAME_TICKET_CODE }, value: { $in: uniqueTicketCodes }
                        }
                    }
                ]
            }
        });
        return { unitPriceOffers };
    });
}
function validateAuthParams(params) {
    let pointAmount = 0;
    const withdrawDescriptions = [];
    for (const knyknrNoInfo of params.authParams.knyknrNoInfo) {
        for (const knshInfo of knyknrNoInfo.knshInfo) {
            const unitPriceOffer = params.unitPriceOffers.find((o) => {
                var _a, _b;
                return ((_b = (_a = o.additionalProperty) === null || _a === void 0 ? void 0 : _a.find(((p) => p.name === 'ticketCode'))) === null || _b === void 0 ? void 0 : _b.value) === knshInfo.knshTyp;
            });
            if (unitPriceOffer === undefined) {
                throw new domain_1.chevre.factory.errors.NotFound(domain_1.chevre.factory.offerType.Offer);
            }
            const withdrawDescription = `${unitPriceOffer.name.ja}${WITHDRAW_DESCRIPTION_SUFFIX}`;
            if (Array.isArray(unitPriceOffer.eligibleMonetaryAmount) && unitPriceOffer.eligibleMonetaryAmount.length > 0) {
                const eligibleMonetaryAmountValue = unitPriceOffer.eligibleMonetaryAmount[0].value;
                if (typeof eligibleMonetaryAmountValue === 'number') {
                    pointAmount += eligibleMonetaryAmountValue * Number(knshInfo.miNum);
                    withdrawDescriptions.push(
                    // tslint:disable-next-line:prefer-array-literal
                    ...[...Array(Number(knshInfo.miNum))].map(() => withdrawDescription));
                }
            }
        }
    }
    return { pointAmount, withdrawDescriptions };
}
function findPaymentCard(params) {
    return (repos) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        // 所有カード検索
        const paymentCardOwnershipInfos = yield repos.ownershipInfo.search({
            // 最も古い所有ペイメントカードをデフォルトペイメントカードとして扱う使用なので、ソート条件は以下の通り
            sort: { ownedFrom: domain_1.chevre.factory.sortType.Ascending },
            limit: 1,
            page: 1,
            project: { id: { $eq: params.project.id } },
            ownedFrom: params.ownedTime,
            ownedThrough: params.ownedTime,
            ownedBy: { id: params.ownedBy.id },
            typeOfGood: {
                issuedThrough: { typeOf: { $eq: domain_1.chevre.factory.product.ProductType.PaymentCard } }
            }
        });
        const paymentCardOwnershipInfo = paymentCardOwnershipInfos.shift();
        if (paymentCardOwnershipInfo === undefined) {
            throw new domain_1.chevre.factory.errors.NotFound('OwnershipInfo', `${domain_1.chevre.factory.product.ProductType.PaymentCard} not found`);
        }
        return {
            identifier: String(paymentCardOwnershipInfo.typeOfGood.identifier),
            issuedThrough: {
                id: String((_a = paymentCardOwnershipInfo.typeOfGood.issuedThrough) === null || _a === void 0 ? void 0 : _a.id)
            }
        };
    });
}
