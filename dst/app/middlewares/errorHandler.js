"use strict";
/**
 * error handler
 * エラーハンドラーミドルウェア
 * @module middlewares.errorHandler
 */
Object.defineProperty(exports, "__esModule", { value: true });
const pecorino = require("@pecorino/domain");
const createDebug = require("debug");
const http_status_1 = require("http-status");
const api_1 = require("../error/api");
const debug = createDebug('pecorino-api:middlewares:errorHandler');
exports.default = (err, __, res, next) => {
    debug(err);
    if (res.headersSent) {
        next(err);
        return;
    }
    let apiError;
    if (err instanceof api_1.APIError) {
        apiError = err;
    }
    else {
        // エラー配列が入ってくることもある
        if (Array.isArray(err)) {
            apiError = new api_1.APIError(pecorinoError2httpStatusCode(err[0]), err);
        }
        else if (err instanceof pecorino.factory.errors.PECORINO) {
            apiError = new api_1.APIError(pecorinoError2httpStatusCode(err), [err]);
        }
        else {
            // 500
            apiError = new api_1.APIError(http_status_1.INTERNAL_SERVER_ERROR, [new pecorino.factory.errors.PECORINO('InternalServerError', err.message)]);
        }
    }
    res.status(apiError.code).json({
        error: apiError.toObject()
    });
};
/**
 * PECORINOエラーをHTTPステータスコードへ変換する
 * @function
 * @param {pecorino.factory.errors.PECORINO} err PECORINOエラー
 */
function pecorinoError2httpStatusCode(err) {
    let statusCode = http_status_1.BAD_REQUEST;
    switch (true) {
        // 401
        case (err instanceof pecorino.factory.errors.Unauthorized):
            statusCode = http_status_1.UNAUTHORIZED;
            break;
        // 403
        case (err instanceof pecorino.factory.errors.Forbidden):
            statusCode = http_status_1.FORBIDDEN;
            break;
        // 404
        case (err instanceof pecorino.factory.errors.NotFound):
            statusCode = http_status_1.NOT_FOUND;
            break;
        // 409
        case (err instanceof pecorino.factory.errors.AlreadyInUse):
            statusCode = http_status_1.CONFLICT;
            break;
        // 429
        case (err instanceof pecorino.factory.errors.RateLimitExceeded):
            statusCode = http_status_1.TOO_MANY_REQUESTS;
            break;
        // 502
        case (err instanceof pecorino.factory.errors.NotImplemented):
            statusCode = http_status_1.NOT_IMPLEMENTED;
            break;
        // 503
        case (err instanceof pecorino.factory.errors.ServiceUnavailable):
            statusCode = http_status_1.SERVICE_UNAVAILABLE;
            break;
        // 400
        default:
            statusCode = http_status_1.BAD_REQUEST;
    }
    return statusCode;
}
