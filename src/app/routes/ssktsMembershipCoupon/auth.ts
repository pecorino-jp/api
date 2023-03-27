/**
 * 認証ルーター
 */
import { chevre } from '@chevre/domain';
import * as express from 'express';
import * as mongoose from 'mongoose';

import { permitScopes } from '../../middlewares/permitScopes';

type IPurchaseNumberAuthIn = chevre.surfrock.service.auth.factory.IPurchaseNumberAuthIn;
type IPurchaseNumberAuthResult = chevre.surfrock.service.auth.factory.IPurchaseNumberAuthResult;
type IPermitOwnershipInfo = chevre.factory.ownershipInfo.IOwnershipInfo<chevre.factory.ownershipInfo.IPermitAsGood>;

function validateMembership(params: {
    project: { id: string };
    permitIdentifier: string;
    ownershipInfoCode: string;
}) {
    return async (repos: {
        authorization: chevre.repository.Code;
        ownershipInfo: chevre.repository.OwnershipInfo;
    }): Promise<{
        membershipOwnershipInfo: IPermitOwnershipInfo;
    }> => {
        const now = new Date();
        const permitIdentifier = params.permitIdentifier;
        const ownershipInfoCode = params.ownershipInfoCode; // 所有権コード

        const authorizations = await repos.authorization.search({
            limit: 1,
            page: 1,
            project: { id: { $eq: params.project.id } },
            code: { $in: [ownershipInfoCode] },
            validFrom: now,
            validThrough: now
        });
        const authorization = authorizations.shift();
        if (authorization === undefined) {
            throw new chevre.factory.errors.NotFound('Authorization');
        }

        const ownershipInfoPayload = authorization.object;
        if (ownershipInfoPayload.typeOf !== 'OwnershipInfo') {
            throw new chevre.factory.errors.Argument('pinCd', 'must be OwnershipInfo');
        }
        if (ownershipInfoPayload.typeOfGood.typeOf !== chevre.factory.permit.PermitType.Permit) {
            throw new chevre.factory.errors.Argument('pinCd', 'must be Permit');
        }
        if (ownershipInfoPayload.typeOfGood.identifier !== permitIdentifier) {
            throw new chevre.factory.errors.Argument('pinCd', 'invalid');
        }
        // 存在確認
        const membershipOwnershipInfo = <IPermitOwnershipInfo>await repos.ownershipInfo.findById({ id: ownershipInfoPayload.id });

        return { membershipOwnershipInfo };
    };
}

const authRouter = express.Router();
authRouter.post(
    '/purchaseNumberAuth',
    permitScopes(['admin']),
    async (req, res, next) => {
        try {
            const authorizationRepo = new chevre.repository.Code(mongoose.connection);
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const ownershipInfoRepo = new chevre.repository.OwnershipInfo(mongoose.connection);

            const purchaseNumberAuthIn: IPurchaseNumberAuthIn = req.body;

            // メンバーシップを検証する(knyknrNoは1つしかリクエストされない前提)
            const permitIdentifier = purchaseNumberAuthIn.knyknrNoInfoIn[0].knyknrNo;
            const ownershipInfoCode = purchaseNumberAuthIn.knyknrNoInfoIn[0].pinCd; // 所有権コード
            const theaterCode = purchaseNumberAuthIn.stCd;

            await validateMembership({
                project: { id: purchaseNumberAuthIn.kgygishCd },
                permitIdentifier,
                ownershipInfoCode
            })({
                authorization: authorizationRepo,
                ownershipInfo: ownershipInfoRepo
            });

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
export { authRouter, validateMembership };
