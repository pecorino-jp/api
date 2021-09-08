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
/**
 * oauthミドルウェア
 */
const domain_1 = require("@cinerino/domain");
const express_middleware_1 = require("@motionpicture/express-middleware");
const createDebug = require("debug");
const debug = createDebug('pecorino-api:middlewares:authentication');
// 許可発行者リスト
const ISSUERS = process.env.TOKEN_ISSUERS.split(',');
const authentication = express_middleware_1.cognitoAuth({
    issuers: ISSUERS,
    authorizedHandler: (user, token, req, __, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            req.user = user;
            req.accessToken = token;
            next();
        }
        catch (error) {
            // AmazonCognitoAPIのレート制限をハンドリング
            if (error.name === 'TooManyRequestsException') {
                next(new domain_1.chevre.factory.errors.RateLimitExceeded(`getUser ${error.message}`));
            }
            else {
                next(new domain_1.chevre.factory.errors.Unauthorized(`${error.name}:${error.message}`));
            }
        }
    }),
    unauthorizedHandler: (err, __1, __2, next) => {
        debug('unauthorized err handled', err);
        next(new domain_1.chevre.factory.errors.Unauthorized(err.message));
    }
});
exports.default = authentication;
