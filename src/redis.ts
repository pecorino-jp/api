import { createClient, RedisDefaultModules } from 'redis';

const PING_INTERVAL = 60000; // 60 seconds

const redisClient = createClient<RedisDefaultModules, Record<string, never>, Record<string, never>>({
    socket: {
        host: <string>process.env.REDIS_HOST,
        port: Number(<string>process.env.REDIS_PORT)
        // tls: (process.env.REDIS_TLS_SERVERNAME !== undefined) ? { servername: process.env.REDIS_TLS_SERVERNAME } : undefined
    },
    password: <string>process.env.REDIS_KEY,
    pingInterval: PING_INTERVAL
});

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

// redisClient.on('ping-interval', (reply) => {
//     // eslint-disable-next-line no-console
//     console.log('ping-interval:', reply);
// });

export { redisClient };
