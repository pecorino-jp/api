/**
 * oauthミドルウェア
 */
import { cognitoAuth } from '@motionpicture/express-middleware';
import * as pecorino from '@pecorino/domain';
import * as createDebug from 'debug';

const debug = createDebug('pecorino-api:middlewares:authentication');

// 許可発行者リスト
const ISSUERS = (<string>process.env.TOKEN_ISSUERS).split(',');

const authentication = cognitoAuth({
    issuers: ISSUERS,
    authorizedHandler: async (user, token, req, __, next) => {
        try {
            req.user = user;
            req.accessToken = token;

            next();
        } catch (error) {
            // AmazonCognitoAPIのレート制限をハンドリング
            if (error.name === 'TooManyRequestsException') {
                next(new pecorino.factory.errors.RateLimitExceeded(`getUser ${error.message}`));
            } else {
                next(new pecorino.factory.errors.Unauthorized(`${error.name}:${error.message}`));
            }
        }
    },
    unauthorizedHandler: (err, __1, __2, next) => {
        debug('unauthorized err handled', err);
        next(new pecorino.factory.errors.Unauthorized(err.message));
    }
});

export default authentication;
