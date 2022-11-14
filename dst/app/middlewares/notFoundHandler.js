"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
/**
 * 404ハンドラーミドルウェア
 */
const domain_1 = require("@chevre/domain");
function notFoundHandler(req, __, next) {
    next(new domain_1.chevre.factory.errors.NotFound(`router for [${req.originalUrl}]`));
}
exports.notFoundHandler = notFoundHandler;
