/**
 * 着券ルーター
 */
import { chevre } from '@chevre/domain';
import * as express from 'express';
import * as mongoose from 'mongoose';

import { permitScopes } from '../../middlewares/permitScopes';

import { validateMembership } from './auth';

import { depositPoint } from './seat/depositPoint';
import { withdrawPoint } from './seat/withdrawPoint';

const OFFER_ADDITIONAL_PROPERTY_NAME_THEATER_CODE = 'theaterCode';
const OFFER_ADDITIONAL_PROPERTY_NAME_TICKET_CODE = 'ticketCode';
const WITHDRAW_DESCRIPTION_SUFFIX = ' 引換';

interface IAuthParams {
    kgygishCd: string;
    yykDvcTyp: string;
    trkshFlg: '0' | '1'; // 0->Withdraw 1->Deposit
    kgygishSstmZskyykNo: string; // 決済ID
    kgygishUsrZskyykNo: string;
    jeiDt: string;
    kijYmd: string;
    stCd: string;
    screnCd: string;
    knyknrNoInfo: [
        {
            knyknrNo: string; // メンバーシップコード
            pinCd: string; // メンバーシップ所有権コード
            knshInfo: {
                knshTyp: string; // チケットコード
                miNum: number; // 枚数
            }[];
        }
    ];
    zskInfo: [
        {
            zskCd: string;
        }
    ];
    skhnCd: string;
}

const seatRouter = express.Router();
seatRouter.post(
    '/seatInfoSync',
    permitScopes(['admin']),
    async (req, res, next) => {
        try {
            const now = new Date();

            const accountRepo = new chevre.repository.Account(mongoose.connection);
            const accountTransactionRepo = new chevre.repository.AccountTransaction(mongoose.connection);
            const authorizationRepo = new chevre.repository.Code(mongoose.connection);
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const ownershipInfoRepo = new chevre.repository.OwnershipInfo(mongoose.connection);
            const sellerRepo = new chevre.repository.Seller(mongoose.connection);

            const authParams: IAuthParams = req.body;

            // 施設検索
            const { seller } = await findSeller({
                authParams,
                project: { id: authParams.kgygishCd }
            })({ seller: sellerRepo });

            // knyknrNoは1つしかリクエストされない前提
            const permitIdentifier = authParams.knyknrNoInfo[0].knyknrNo;
            const ownershipInfoCode = authParams.knyknrNoInfo[0].pinCd; // 所有権コード

            const { membershipOwnershipInfo } = await validateMembership({
                project: { id: authParams.kgygishCd },
                permitIdentifier,
                ownershipInfoCode
            })({
                authorization: authorizationRepo,
                ownershipInfo: ownershipInfoRepo
            });

            let identifier: string;

            const ownershipInfoTypeOfGoodIssuedThrough = membershipOwnershipInfo.typeOfGood.issuedThrough?.typeOf;
            if (ownershipInfoTypeOfGoodIssuedThrough === chevre.factory.product.ProductType.MembershipService) {
                const ownerId: string = Array.isArray(membershipOwnershipInfo.ownedBy)
                    ? membershipOwnershipInfo.ownedBy[0].id
                    : membershipOwnershipInfo.ownedBy.id;
                const findPaymentCardResult = await findPaymentCard({
                    project: { id: authParams.kgygishCd },
                    ownedBy: { id: ownerId },
                    ownedTime: now
                })({ ownershipInfo: ownershipInfoRepo });
                identifier = findPaymentCardResult.identifier;
            } else {
                throw new chevre.factory.errors.Argument('pinCd', `invalid typeOfGood: ${ownershipInfoTypeOfGoodIssuedThrough}`);
            }

            if (authParams.trkshFlg === '0') {
                // メンバーシップを検証する
                const transactionNumber = authParams.kgygishSstmZskyykNo;

                const { unitPriceOffers } = await searchAvailableUnitPriceOffers({
                    authParams,
                    project: { id: authParams.kgygishCd }
                })({ offer: offerRepo });

                const { pointAmount, withdrawDescriptions } = validateAuthParams({ authParams, unitPriceOffers });
                if (pointAmount > 0) {
                    await withdrawPoint({
                        project: { id: authParams.kgygishCd },
                        amount: pointAmount,
                        transactionNumber,
                        accountNumber: identifier,
                        withdrawDescriptions,
                        sellerName: String(seller.name.ja)
                    })({ account: accountRepo, accountTransaction: accountTransactionRepo });
                }
            } else {
                const transactionNumber = authParams.kgygishSstmZskyykNo;

                await depositPoint({
                    project: { id: authParams.kgygishCd },
                    transactionNumber,
                    sellerName: String(seller.name.ja),
                    recipientName: permitIdentifier
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
        } catch (error) {
            next(error);
        }
    }
);

function findSeller(params: {
    authParams: IAuthParams;
    project: { id: string };
}) {
    return async (repos: {
        seller: chevre.repository.Seller;
    }): Promise<{
        seller: Omit<chevre.factory.seller.ISeller, 'hasMerchantReturnPolicy' | 'makesOffer' | 'paymentAccepted'>;
    }> => {
        const theaterCode = params.authParams.stCd;

        // 施設検索
        const sellers = <Omit<chevre.factory.seller.ISeller, 'hasMerchantReturnPolicy' | 'makesOffer' | 'paymentAccepted'>[]>
            await repos.seller.search(
                {
                    limit: 1,
                    page: 1,
                    project: { id: { $eq: params.project.id } },
                    branchCode: { $eq: theaterCode }
                },
                {
                    hasMerchantReturnPolicy: 0,
                    makesOffer: 0,
                    paymentAccepted: 0
                }
            );
        const seller = sellers.shift();
        if (seller === undefined) {
            throw new chevre.factory.errors.NotFound('Seller');
        }

        return { seller };
    };
}

function searchAvailableUnitPriceOffers(params: {
    authParams: IAuthParams;
    project: { id: string };
}) {
    return async (repos: {
        offer: chevre.repository.Offer;
    }): Promise<{
        unitPriceOffers: chevre.factory.unitPriceOffer.IUnitPriceOffer[];
    }> => {
        const theaterCode = params.authParams.stCd;

        let uniqueTicketCodes: string[] = [];
        params.authParams.knyknrNoInfo.forEach((knyknrNoInfo) => {
            knyknrNoInfo.knshInfo.forEach((knshInfo) => {
                uniqueTicketCodes.push(knshInfo.knshTyp);
            });
        });
        uniqueTicketCodes = [...new Set(uniqueTicketCodes)];
        if (uniqueTicketCodes.length === 0) {
            throw new chevre.factory.errors.ArgumentNull('knyknrNoInfo.knshInfo.knshTyp');
        }

        // 単価オファーを確認
        const unitPriceOffers = await repos.offer.search({
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
    };
}

function validateAuthParams(params: {
    authParams: IAuthParams;
    unitPriceOffers: chevre.factory.unitPriceOffer.IUnitPriceOffer[];
}) {
    let pointAmount: number = 0;
    const withdrawDescriptions: string[] = [];

    for (const knyknrNoInfo of params.authParams.knyknrNoInfo) {
        for (const knshInfo of knyknrNoInfo.knshInfo) {
            const unitPriceOffer = params.unitPriceOffers.find((o) => {
                return o.additionalProperty?.find(((p) => p.name === 'ticketCode'))?.value === knshInfo.knshTyp;
            });
            if (unitPriceOffer === undefined) {
                throw new chevre.factory.errors.NotFound(chevre.factory.offerType.Offer);
            }
            const withdrawDescription: string = `${unitPriceOffer.name.ja}${WITHDRAW_DESCRIPTION_SUFFIX}`;
            if (Array.isArray(unitPriceOffer.eligibleMonetaryAmount) && unitPriceOffer.eligibleMonetaryAmount.length > 0) {
                const eligibleMonetaryAmountValue = unitPriceOffer.eligibleMonetaryAmount[0].value;
                if (typeof eligibleMonetaryAmountValue === 'number') {
                    pointAmount += eligibleMonetaryAmountValue * Number(knshInfo.miNum);
                    withdrawDescriptions.push(
                        // tslint:disable-next-line:prefer-array-literal
                        ...[...Array(Number(knshInfo.miNum))].map(() => withdrawDescription)
                    );
                }
            }

        }
    }

    return { pointAmount, withdrawDescriptions };
}

function findPaymentCard(params: {
    project: { id: string };
    ownedBy: { id: string };
    ownedTime: Date;
}) {
    return async (repos: {
        ownershipInfo: chevre.repository.OwnershipInfo;
    }) => {
        // 所有カード検索
        const paymentCardOwnershipInfos = await repos.ownershipInfo.search({
            // 最も古い所有ペイメントカードをデフォルトペイメントカードとして扱う使用なので、ソート条件は以下の通り
            sort: { ownedFrom: chevre.factory.sortType.Ascending },
            limit: 1,
            page: 1,
            project: { id: { $eq: params.project.id } },
            ownedFrom: params.ownedTime,
            ownedThrough: params.ownedTime,
            ownedBy: { id: params.ownedBy.id },
            typeOfGood: {
                issuedThrough: { typeOf: { $eq: chevre.factory.product.ProductType.PaymentCard } }
            }
        });
        const paymentCardOwnershipInfo = paymentCardOwnershipInfos.shift();
        if (paymentCardOwnershipInfo === undefined) {
            throw new chevre.factory.errors.NotFound(
                'OwnershipInfo', `${chevre.factory.product.ProductType.PaymentCard} not found`
            );

        }

        return {
            identifier: String((<chevre.factory.ownershipInfo.IPermitAsGood>paymentCardOwnershipInfo.typeOfGood).identifier)
        };
    };
}

export { seatRouter };
