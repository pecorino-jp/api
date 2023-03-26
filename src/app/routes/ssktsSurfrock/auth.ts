/**
 * 認証ルーター
 */
import { chevre } from '@chevre/domain';
import * as express from 'express';
import * as mongoose from 'mongoose';

import { permitScopes } from '../../middlewares/permitScopes';

type IPurchaseNumberAuthIn = chevre.surfrock.service.auth.factory.IPurchaseNumberAuthIn;
type IPurchaseNumberAuthResult = chevre.surfrock.service.auth.factory.IPurchaseNumberAuthResult;

const authRouter = express.Router();
authRouter.post(
    '/purchaseNumberAuth',
    permitScopes(['admin']),
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);

            const purchaseNumberAuthIn: IPurchaseNumberAuthIn = req.body;

            // メンバーシップを検証する(knyknrNoは1つしかリクエストされない前提)
            const permitIdentifier = purchaseNumberAuthIn.knyknrNoInfoIn[0].knyknrNo;
            const theaterCode = purchaseNumberAuthIn.stCd;

            // 指定された劇場コードとチケットコードの単価オファーを検索する
            const unitPriceOffers = await offerRepo.search({
                project: { id: { $eq: purchaseNumberAuthIn.kgygishCd } },
                additionalProperty: {
                    $elemMatch: {
                        name: { $eq: 'theaterCode' },
                        value: { $eq: theaterCode }
                    }
                }
            });

            const result: IPurchaseNumberAuthResult = {
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
                            return {
                                ykknshTyp: String(unitPriceOffer.additionalProperty?.find(((p) => p.name === 'ticketCode'))?.value),
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
        } catch (error) {
            next(error);
        }
    }
);
export { authRouter };
