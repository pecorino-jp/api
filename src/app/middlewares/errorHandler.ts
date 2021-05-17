/**
 * error handler
 * エラーハンドラーミドルウェア
 * @module middlewares.errorHandler
 */

import * as pecorino from '@pecorino/domain';
import * as createDebug from 'debug';
import { NextFunction, Request, Response } from 'express';
import {
    BAD_REQUEST,
    CONFLICT, FORBIDDEN,
    INTERNAL_SERVER_ERROR,
    NOT_FOUND,
    NOT_IMPLEMENTED,
    SERVICE_UNAVAILABLE,
    TOO_MANY_REQUESTS,
    UNAUTHORIZED
} from 'http-status';

import { APIError } from '../error/api';

const debug = createDebug('pecorino-api:middlewares:errorHandler');

export default (err: any, __: Request, res: Response, next: NextFunction) => {
    debug(err);

    if (res.headersSent) {
        next(err);

        return;
    }

    let apiError: APIError;
    if (err instanceof APIError) {
        apiError = err;
    } else {
        // エラー配列が入ってくることもある
        if (Array.isArray(err)) {
            apiError = new APIError(pecorinoError2httpStatusCode(err[0]), err);
        } else if (err instanceof pecorino.factory.errors.Chevre) {
            apiError = new APIError(pecorinoError2httpStatusCode(err), [err]);
        } else {
            // 500
            apiError = new APIError(INTERNAL_SERVER_ERROR, [new pecorino.factory.errors.Chevre(<any>'InternalServerError', err.message)]);
        }
    }

    res.status(apiError.code)
        .json({
            error: apiError.toObject()
        });
};

/**
 * PECORINOエラーをHTTPステータスコードへ変換する
 */
function pecorinoError2httpStatusCode(err: pecorino.factory.errors.Chevre) {
    let statusCode = BAD_REQUEST;

    switch (true) {
        // 401
        case (err instanceof pecorino.factory.errors.Unauthorized):
            statusCode = UNAUTHORIZED;
            break;

        // 403
        case (err instanceof pecorino.factory.errors.Forbidden):
            statusCode = FORBIDDEN;
            break;

        // 404
        case (err instanceof pecorino.factory.errors.NotFound):
            statusCode = NOT_FOUND;
            break;

        // 409
        case (err instanceof pecorino.factory.errors.AlreadyInUse):
            statusCode = CONFLICT;
            break;

        // 429
        case (err instanceof pecorino.factory.errors.RateLimitExceeded):
            statusCode = TOO_MANY_REQUESTS;
            break;

        // 502
        case (err instanceof pecorino.factory.errors.NotImplemented):
            statusCode = NOT_IMPLEMENTED;
            break;

        // 503
        case (err instanceof pecorino.factory.errors.ServiceUnavailable):
            statusCode = SERVICE_UNAVAILABLE;
            break;

        // 400
        default:
            statusCode = BAD_REQUEST;
    }

    return statusCode;
}
