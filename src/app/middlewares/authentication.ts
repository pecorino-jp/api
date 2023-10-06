/**
 * oauthミドルウェア
 */
import { cognitoAuth } from '@motionpicture/express-middleware';
import { NextFunction, Request, Response } from 'express';

import { TOKEN_ISSUERS, TOKEN_ISSUER_REQUEST_TIMEOUT } from '../settings';

let cognitoAuthMiddeware: typeof cognitoAuth | undefined;
export async function authentication(req: Request, res: Response, next: NextFunction) {
    if (cognitoAuthMiddeware === undefined) {
        const expressMiddleware = await import('@motionpicture/express-middleware');
        cognitoAuthMiddeware = expressMiddleware.cognitoAuth;
    }

    return cognitoAuthMiddeware({
        issuers: TOKEN_ISSUERS,
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
        requestOptions: { timeout: TOKEN_ISSUER_REQUEST_TIMEOUT }
    })(req, res, next);
}
