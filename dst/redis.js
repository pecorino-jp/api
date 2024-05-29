"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const redis_1 = require("redis");
const PING_INTERVAL = 60000;
const redisClient = (0, redis_1.createClient)({
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    },
    password: process.env.REDIS_KEY,
    pingInterval: PING_INTERVAL
});
exports.redisClient = redisClient;
redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
});
redisClient.connect()
    .then()
    .catch((err) => {
    console.error('redisClient.connect:', err);
    process.exit(1);
});
