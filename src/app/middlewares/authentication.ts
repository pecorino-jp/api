/**
 * oauthミドルウェア
 */
import { cognitoAuth } from '@motionpicture/express-middleware';
import type { NextFunction, Request, Response } from 'express';

import { TOKEN_ISSUERS, TOKEN_ISSUER_REQUEST_TIMEOUT } from '../settings';

export async function authentication(req: Request, res: Response, next: NextFunction) {
    try {
        await cognitoAuth({
            authorizedHandler: async (user, token, reqOnAuthorize, __, nextOnAuthorize) => {
                reqOnAuthorize.user = user;
                reqOnAuthorize.accessToken = token;

                nextOnAuthorize();
            },
            unauthorizedHandler: (err, reqOnUnauthoize, __2, nextOnUnauthoize) => {
                // AbortErrorをハンドリング(2023-02-13~)
                if (err.name === 'AbortError') {
                    nextOnUnauthoize(new reqOnUnauthoize.chevre.factory.errors.ServiceUnavailable(`issuer unavailable. ${err.name}:${err.message}`));
                    // AmazonCognitoAPIのレート制限をハンドリング
                } else if (err.name === 'TooManyRequestsException') {
                    nextOnUnauthoize(new reqOnUnauthoize.chevre.factory.errors.RateLimitExceeded(`getUser ${err.message}`));
                } else {
                    nextOnUnauthoize(new reqOnUnauthoize.chevre.factory.errors.Unauthorized(`${err.name}:${err.message}`));
                }
            },
            // タイムアウト設定(2023-04-17~)
            requestOptions: { timeout: TOKEN_ISSUER_REQUEST_TIMEOUT },
            verifyOptions: {
                tokenUse: 'access',
                decodeWithoutVerifying: false,
                issuers: TOKEN_ISSUERS
            }
        })(req, res, next);
    } catch (error) {
        next(new req.chevre.factory.errors.Unauthorized(error.message));
    }
}
