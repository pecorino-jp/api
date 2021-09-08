"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 404ハンドラーミドルウェア
 */
const domain_1 = require("@cinerino/domain");
exports.default = (req, __, next) => {
    next(new domain_1.chevre.factory.errors.NotFound(`router for [${req.originalUrl}]`));
};
