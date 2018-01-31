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
 * ヘルスチェックルーターテスト
 * @ignore
 */
const pecorino = require("@motionpicture/pecorino-domain");
const assert = require("assert");
const httpStatus = require("http-status");
const supertest = require("supertest");
const app = require("../../app/app");
const mongooseConnectionOptions_1 = require("../../mongooseConnectionOptions");
const MONGOOSE_CONNECTION_READY_STATE_CONNECTED = 1;
const INTERVALS_CHECK_CONNECTION = 2000;
describe('ヘルスチェック', () => {
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        pecorino.mongoose.connect(process.env.MONGOLAB_URI, mongooseConnectionOptions_1.default)
            .then(() => {
            // no op
        })
            .catch(console.error);
    }));
    afterEach(() => __awaiter(this, void 0, void 0, function* () {
        pecorino.mongoose.connect(process.env.MONGOLAB_URI, mongooseConnectionOptions_1.default)
            .then(() => {
            // no op
        })
            .catch(console.error);
    }));
    it('mongodbに接続済みであれば健康', () => __awaiter(this, void 0, void 0, function* () {
        yield new Promise((resolve, reject) => {
            const timer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                if (pecorino.mongoose.connection.readyState !== MONGOOSE_CONNECTION_READY_STATE_CONNECTED) {
                    return;
                }
                clearInterval(timer);
                try {
                    yield supertest(app)
                        .get('/health')
                        .set('Accept', 'application/json')
                        .expect(httpStatus.OK)
                        .then((response) => {
                        assert.equal(typeof response.text, 'string');
                    });
                    resolve();
                }
                catch (error) {
                    reject(error);
                }
            }), INTERVALS_CHECK_CONNECTION);
        });
    }));
    it('mongodb接続切断後アクセスすればBAD_REQUEST', () => __awaiter(this, void 0, void 0, function* () {
        yield new Promise((resolve, reject) => {
            const timer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                if (pecorino.mongoose.connection.readyState !== MONGOOSE_CONNECTION_READY_STATE_CONNECTED) {
                    return;
                }
                clearInterval(timer);
                try {
                    // mongooseデフォルトコネクションを切断
                    yield pecorino.mongoose.connection.close();
                    yield supertest(app)
                        .get('/health')
                        .set('Accept', 'application/json')
                        .expect(httpStatus.INTERNAL_SERVER_ERROR)
                        .then();
                    // mongodb接続しなおす
                    pecorino.mongoose.connect(process.env.MONGOLAB_URI, mongooseConnectionOptions_1.default, (err) => {
                        if (err instanceof Error) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                }
                catch (error) {
                    reject(error);
                }
            }), INTERVALS_CHECK_CONNECTION);
        });
    }));
});
