"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
function notFoundHandler(req, __, next) {
    next(new req.chevre.factory.errors.NotFound(`router for [${req.originalUrl}]`));
}
exports.notFoundHandler = notFoundHandler;
