"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const redis_1 = require("redis");
const PING_INTERVAL = 60000; // 60 seconds
const redisClient = (0, redis_1.createClient)({
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
        // tls: (process.env.REDIS_TLS_SERVERNAME !== undefined) ? { servername: process.env.REDIS_TLS_SERVERNAME } : undefined
    },
    password: process.env.REDIS_KEY,
    pingInterval: PING_INTERVAL
});
exports.redisClient = redisClient;
redisClient.on('error', (err) => {
    // tslint:disable-next-line:no-console
    console.error('Redis Client Error', err);
});
redisClient.connect()
    .then()
    .catch((err) => {
    // tslint:disable-next-line:no-console
    console.error('redisClient.connect:', err);
    // tslint:disable-next-line:no-magic-numbers
    process.exit(1);
});
