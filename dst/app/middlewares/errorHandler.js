"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const createDebug = require("debug");
const http_status_1 = require("http-status");
const api_1 = require("../error/api");
const debug = createDebug('pecorino-api:middlewares:errorHandler');
function errorHandler(err, req, res, next) {
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
        if (Array.isArray(err)) {
            apiError = new api_1.APIError(pecorinoError2httpStatusCode(err[0], req.chevre.factory), err);
        }
        else if (err instanceof req.chevre.factory.errors.Chevre) {
            apiError = new api_1.APIError(pecorinoError2httpStatusCode(err, req.chevre.factory), [err]);
        }
        else {
            apiError = new api_1.APIError(http_status_1.INTERNAL_SERVER_ERROR, [new req.chevre.factory.errors.Chevre('InternalServerError', err.message)]);
        }
    }
    res.status(apiError.code)
        .json({
        error: apiError.toObject()
    });
}
exports.errorHandler = errorHandler;
function pecorinoError2httpStatusCode(err, factory) {
    let statusCode = http_status_1.BAD_REQUEST;
    switch (true) {
        case (err instanceof factory.errors.Unauthorized):
            statusCode = http_status_1.UNAUTHORIZED;
            break;
        case (err instanceof factory.errors.Forbidden):
            statusCode = http_status_1.FORBIDDEN;
            break;
        case (err instanceof factory.errors.NotFound):
            statusCode = http_status_1.NOT_FOUND;
            break;
        case (err instanceof factory.errors.AlreadyInUse):
            statusCode = http_status_1.CONFLICT;
            break;
        case (err instanceof factory.errors.RateLimitExceeded):
            statusCode = http_status_1.TOO_MANY_REQUESTS;
            break;
        case (err instanceof factory.errors.NotImplemented):
            statusCode = http_status_1.NOT_IMPLEMENTED;
            break;
        case (err instanceof factory.errors.ServiceUnavailable):
            statusCode = http_status_1.SERVICE_UNAVAILABLE;
            break;
        default:
            statusCode = http_status_1.BAD_REQUEST;
    }
    return statusCode;
}
