"use strict";
// tslint:disable:no-implicit-dependencies
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * expressアプリケーションテスト
 * @ignore
 */
const clearReuire = require("clear-require");
const http_status_1 = require("http-status");
const assert = require("power-assert");
const request = require("supertest");
describe('GET /', () => {
    beforeEach(() => {
        delete process.env.BASIC_AUTH_NAME;
        delete process.env.BASIC_AUTH_PASS;
        clearReuire('./app');
    });
    afterEach(() => {
        delete process.env.BASIC_AUTH_NAME;
        delete process.env.BASIC_AUTH_PASS;
    });
    it('ベーシック認証設定がなければ、NOT_FOUNDのはず', () => __awaiter(this, void 0, void 0, function* () {
        // tslint:disable-next-line:no-require-imports
        const app = require('./app');
        yield request(app)
            .get('/')
            .set('Accept', 'application/json')
            .expect(http_status_1.NOT_FOUND)
            .then((response) => {
            assert.equal(typeof response.body.error, 'object');
        });
    }));
    it('ベーシック認証設定があれば、UNAUTHORIZEDのはず', () => __awaiter(this, void 0, void 0, function* () {
        process.env.BASIC_AUTH_NAME = 'name';
        process.env.BASIC_AUTH_PASS = 'pass';
        // tslint:disable-next-line:no-require-imports
        const app = require('./app');
        yield request(app)
            .get('/')
            .set('Accept', 'application/json')
            .expect(http_status_1.UNAUTHORIZED)
            .then((response) => {
            assert.equal(typeof response.body.error, 'object');
        });
    }));
});
