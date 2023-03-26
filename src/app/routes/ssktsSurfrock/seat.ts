/**
 * 着券ルーター
 */
import * as express from 'express';

import { permitScopes } from '../../middlewares/permitScopes';

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
            const authParams: IAuthParams = req.body;

            if (authParams.trkshFlg === '0') {
                // no op
            } else {
                // no op
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

export { seatRouter };
