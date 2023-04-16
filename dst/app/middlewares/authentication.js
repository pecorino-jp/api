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
exports.authentication = void 0;
/**
 * oauthミドルウェア
 */
const domain_1 = require("@chevre/domain");
const express_middleware_1 = require("@motionpicture/express-middleware");
const settings_1 = require("../settings");
const authentication = (0, express_middleware_1.cognitoAuth)({
    issuers: settings_1.TOKEN_ISSUERS,
    authorizedHandler: (user, token, req, __, next) => __awaiter(void 0, void 0, void 0, function* () {
        req.user = user;
        req.accessToken = token;
        next();
    }),
    unauthorizedHandler: (err, __1, __2, next) => {
        // AbortErrorをハンドリング(2023-02-13~)
        if (err.name === 'AbortError') {
            next(new domain_1.chevre.factory.errors.ServiceUnavailable(`issuer unavailable. ${err.name}:${err.message}`));
            // AmazonCognitoAPIのレート制限をハンドリング
        }
        else if (err.name === 'TooManyRequestsException') {
            next(new domain_1.chevre.factory.errors.RateLimitExceeded(`getUser ${err.message}`));
        }
        else {
            next(new domain_1.chevre.factory.errors.Unauthorized(`${err.name}:${err.message}`));
        }
    },
    // タイムアウト設定(2023-04-17~)
    requestOptions: { timeout: settings_1.TOKEN_ISSUER_REQUEST_TIMEOUT }
});
exports.authentication = authentication;
