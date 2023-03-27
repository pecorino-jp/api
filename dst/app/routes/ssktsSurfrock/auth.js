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
exports.authRouter = void 0;
/**
 * 認証ルーター
 */
const domain_1 = require("@chevre/domain");
const express = require("express");
const mongoose = require("mongoose");
const permitScopes_1 = require("../../middlewares/permitScopes");
const authRouter = express.Router();
exports.authRouter = authRouter;
authRouter.post('/purchaseNumberAuth', (0, permitScopes_1.permitScopes)(['admin']), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerRepo = new domain_1.chevre.repository.Offer(mongoose.connection);
        const purchaseNumberAuthIn = req.body;
        // メンバーシップを検証する(knyknrNoは1つしかリクエストされない前提)
        const permitIdentifier = purchaseNumberAuthIn.knyknrNoInfoIn[0].knyknrNo;
        const theaterCode = purchaseNumberAuthIn.stCd;
        // 指定された劇場コードとチケットコードの単価オファーを検索する
        const unitPriceOffers = yield offerRepo.search({
            project: { id: { $eq: purchaseNumberAuthIn.kgygishCd } },
            additionalProperty: {
                $elemMatch: {
                    name: { $eq: 'theaterCode' },
                    value: { $eq: theaterCode }
                }
            }
        });
        const result = {
            resultInfo: {
                status: 'N000',
                message: 'Success'
            },
            ykknmiNumSum: unitPriceOffers.length,
            mkknmiNumSum: 0,
            knyknrNoInfoOut: [
                {
                    knyknrNo: permitIdentifier,
                    knyknrNoMkujyuCd: '',
                    kgygftknknyYmd: '',
                    kgygftknykTm: '',
                    dnshKmTyp: '',
                    znkkkytsknGkjknTyp: '',
                    ykknmiNum: String(unitPriceOffers.length),
                    mkknmiNum: '0',
                    ykknInfo: unitPriceOffers.map((unitPriceOffer) => {
                        var _a, _b;
                        return {
                            ykknshTyp: String((_b = (_a = unitPriceOffer.additionalProperty) === null || _a === void 0 ? void 0 : _a.find(((p) => p.name === 'ticketCode'))) === null || _b === void 0 ? void 0 : _b.value),
                            ykknKnshbtsmiNum: '1',
                            eishhshkTyp: '',
                            knshknhmbiUnip: String(unitPriceOffer.priceSpecification.price),
                            kijUnip: ''
                        };
                    }),
                    // tslint:disable-next-line:no-null-keyword
                    mkknInfo: null
                }
            ]
        };
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}));
