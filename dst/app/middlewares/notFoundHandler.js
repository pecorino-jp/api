"use strict";
/**
 * 404ハンドラーミドルウェア
 * @module middlewares.notFoundHandler
 */
Object.defineProperty(exports, "__esModule", { value: true });
const pecorino = require("@motionpicture/pecorino-domain");
exports.default = (req, __, next) => {
    next(new pecorino.factory.errors.NotFound(`router for [${req.originalUrl}]`));
};
