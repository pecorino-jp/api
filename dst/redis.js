"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = void 0;
/**
 * redis cacheクライアント
 */
const createDebug = require("debug");
const redis = require("redis");
const debug = createDebug('pecorino-api:redis');
const CONNECT_TIMEOUT_IN_MILLISECONDS = 3600000;
const MAX_ATTEMPTS = 10;
const PING_INTERVAL = 60000; // 60 seconds
let client;
/**
 * AzureRedisは10分間アイドル状態だとタイムアウトしてコネクションが切断される
 * 無駄な再コネクションを避けるために定期的にPINGコマンドを送信する
 * http://aka.ms/redis/p/bestpractices
 */
setInterval(() => {
    if (client !== undefined) {
        debug('redisClient => Sending Ping...');
        client.ping();
    }
}, PING_INTERVAL);
// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
function createClient() {
    const c = redis.createClient({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_KEY,
        tls: (process.env.REDIS_TLS_SERVERNAME !== undefined) ? { servername: process.env.REDIS_TLS_SERVERNAME } : undefined,
        // If you return a number from this function, the retry will happen exactly after that time in milliseconds.
        // If you return a non-number, no further retry will happen and all offline commands are flushed with errors.
        // Return an error to return that specific error to all offline commands.
        retry_strategy: (options) => {
            debug('retrying...', options);
            if (options.error instanceof Error && options.error.code === 'ECONNREFUSED') {
                // tslint:disable-next-line:no-console
                console.error('redisClient.retry_strategy:', options.error);
                // redisClient = redisClient.duplicate();
                // End reconnecting on a specific error and flush all commands with a individual error
                // return new Error('The server refused the connection');
            }
            if (options.total_retry_time > CONNECT_TIMEOUT_IN_MILLISECONDS) {
                resetClient();
                // End reconnecting after a specific timeout and flush all commands with a individual error
                return new Error('Retry time exhausted');
            }
            if (MAX_ATTEMPTS > 0 && options.attempt > MAX_ATTEMPTS) {
                resetClient();
                return new Error('Retry attempts exhausted');
            }
            // reconnect after
            // tslint:disable-next-line:no-magic-numbers
            return Math.min(options.attempt * 100, 3000);
        }
    });
    // redisClient.on('ready', () => {
    //     debug('ready');
    // });
    // redisClient.on('connect', () => {
    //     debug('connected');
    // });
    // redisClient.on('reconnecting', () => {
    //     debug('reconnecting...');
    // });
    c.on('error', (err) => {
        // tslint:disable-next-line:no-console
        console.error('redisClient emitted an error', err);
    });
    // c.on('end', () => {
    //     debug('end');
    // });
    return c;
}
/**
 * 接続クライアントをリセットする
 * 接続リトライをギブアップした場合に呼び出される
 */
// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
function resetClient() {
    client = undefined;
}
function getClient() {
    if (client === undefined) {
        client = createClient();
    }
    return client;
}
exports.getClient = getClient;