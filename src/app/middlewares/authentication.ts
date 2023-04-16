/**
 * oauthミドルウェア
 */
import { chevre } from '@chevre/domain';
import { cognitoAuth } from '@motionpicture/express-middleware';

import { TOKEN_ISSUERS, TOKEN_ISSUER_REQUEST_TIMEOUT } from '../settings';

const authentication = cognitoAuth({
    issuers: TOKEN_ISSUERS,
    authorizedHandler: async (user, token, req, __, next) => {
        req.user = user;
        req.accessToken = token;

        next();
    },
    unauthorizedHandler: (err, __1, __2, next) => {
        // AbortErrorをハンドリング(2023-02-13~)
        if (err.name === 'AbortError') {
            next(new chevre.factory.errors.ServiceUnavailable(`issuer unavailable. ${err.name}:${err.message}`));
            // AmazonCognitoAPIのレート制限をハンドリング
        } else if (err.name === 'TooManyRequestsException') {
            next(new chevre.factory.errors.RateLimitExceeded(`getUser ${err.message}`));
        } else {
            next(new chevre.factory.errors.Unauthorized(`${err.name}:${err.message}`));
        }
    },
    // タイムアウト設定(2023-04-17~)
    requestOptions: { timeout: TOKEN_ISSUER_REQUEST_TIMEOUT }
});

export { authentication };
