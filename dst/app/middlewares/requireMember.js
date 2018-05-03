"use strict";
/**
 * 会員必須ミドルウェア
 * @module middlewares.requireMember
 */
Object.defineProperty(exports, "__esModule", { value: true });
const pecorino = require("@motionpicture/pecorino-domain");
const createDebug = require("debug");
const debug = createDebug('pecorino-api:middlewares:requireMember');
exports.default = (req, __, next) => {
    // 会員としてログイン済みであればOK
    if (isMember(req.user)) {
        debug('logged in as', req.user.sub);
        next();
    }
    else {
        next(new pecorino.factory.errors.Forbidden('login required'));
    }
};
function isMember(user) {
    return (user.username !== undefined);
}
