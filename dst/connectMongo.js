"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongo = void 0;
const createDebug = require("debug");
const mongoose = require("mongoose");
const debug = createDebug('pecorino-api:connectMongo');
const MONGOLAB_URI = process.env.MONGOLAB_URI;
const AUTO_INDEX = process.env.MONGO_AUTO_INDEX_DISABLED !== '1';
const MONGO_PING_INTERVAL_MS = (typeof process.env.MONGO_PING_INTERVAL_MS === 'string')
    ? Number(process.env.MONGO_PING_INTERVAL_MS)
    : 30000;
const MONGO_PING_TIMEOUT_MS = (typeof process.env.MONGO_PING_TIMEOUT_MS === 'string')
    ? Number(process.env.MONGO_PING_TIMEOUT_MS)
    : 10000;
const connectOptions = {
    autoIndex: AUTO_INDEX,
    keepAlive: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000
};
function connectMongo(params) {
    return __awaiter(this, void 0, void 0, function* () {
        let connection;
        if (params === undefined || params.defaultConnection) {
            yield mongoose.connect(MONGOLAB_URI, connectOptions);
            connection = mongoose.connection;
        }
        else {
            connection = mongoose.createConnection(MONGOLAB_URI, connectOptions);
        }
        if (params.disableCheck === undefined || params.disableCheck === false) {
            setInterval(() => __awaiter(this, void 0, void 0, function* () {
                if (connection.readyState === 1) {
                    let pingResult;
                    yield new Promise((resolve) => {
                        try {
                            connection.db.admin()
                                .ping()
                                .then((result) => {
                                pingResult = result;
                                debug('pingResult:', pingResult);
                            })
                                .catch((error) => {
                                console.error('ping error:', error);
                            });
                        }
                        catch (error) {
                            console.error('connection.db.admin() error:', error);
                        }
                        setTimeout(() => { resolve(); }, MONGO_PING_TIMEOUT_MS);
                    });
                    if (pingResult !== undefined && pingResult.ok === 1) {
                        return;
                    }
                }
                try {
                    yield connection.close();
                    yield connection.openUri(MONGOLAB_URI, connectOptions);
                    debug('MongoDB reconnected!');
                }
                catch (error) {
                    console.error('mongoose.connect:', error);
                }
            }), MONGO_PING_INTERVAL_MS);
        }
        return connection;
    });
}
exports.connectMongo = connectMongo;
