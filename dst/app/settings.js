"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_ISSUERS = exports.TOKEN_ISSUER_REQUEST_TIMEOUT = void 0;
exports.TOKEN_ISSUER_REQUEST_TIMEOUT = (typeof process.env.TOKEN_ISSUER_REQUEST_TIMEOUT === 'string')
    ? Number(process.env.TOKEN_ISSUER_REQUEST_TIMEOUT)
    // tslint:disable-next-line:no-magic-numbers
    : 5000;
// 許可発行者リスト
exports.TOKEN_ISSUERS = process.env.TOKEN_ISSUERS.split(' ');
