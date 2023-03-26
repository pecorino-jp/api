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
const express = require("express");
const permitScopes_1 = require("../../middlewares/permitScopes");
const seatRouter = express.Router();
exports.seatRouter = seatRouter;
seatRouter.post('/seatInfoSync', (0, permitScopes_1.permitScopes)(['admin']), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authParams = req.body;
        if (authParams.trkshFlg === '0') {
            // no op
        }
        else {
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
    }
    catch (error) {
        next(error);
    }
}));
