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
const settings_1 = require("../settings");
let cognitoAuthMiddeware;
function authentication(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (cognitoAuthMiddeware === undefined) {
            const expressMiddleware = yield Promise.resolve().then(() => require('@motionpicture/express-middleware'));
            cognitoAuthMiddeware = expressMiddleware.cognitoAuth;
        }
        return cognitoAuthMiddeware({
            issuers: settings_1.TOKEN_ISSUERS,
            authorizedHandler: (user, token, reqOnAuthorize, __, nextOnAuthorize) => __awaiter(this, void 0, void 0, function* () {
                reqOnAuthorize.user = user;
                reqOnAuthorize.accessToken = token;
                nextOnAuthorize();
            }),
            unauthorizedHandler: (err, reqOnUnauthoize, __2, nextOnUnauthoize) => {
                // AbortErrorをハンドリング(2023-02-13~)
                if (err.name === 'AbortError') {
                    nextOnUnauthoize(new reqOnUnauthoize.chevre.factory.errors.ServiceUnavailable(`issuer unavailable. ${err.name}:${err.message}`));
                    // AmazonCognitoAPIのレート制限をハンドリング
                }
                else if (err.name === 'TooManyRequestsException') {
                    nextOnUnauthoize(new reqOnUnauthoize.chevre.factory.errors.RateLimitExceeded(`getUser ${err.message}`));
                }
                else {
                    nextOnUnauthoize(new reqOnUnauthoize.chevre.factory.errors.Unauthorized(`${err.name}:${err.message}`));
                }
            },
            // タイムアウト設定(2023-04-17~)
            requestOptions: { timeout: settings_1.TOKEN_ISSUER_REQUEST_TIMEOUT }
        })(req, res, next);
    });
}
exports.authentication = authentication;
