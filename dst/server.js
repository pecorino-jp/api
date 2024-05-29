"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const startTime = process.hrtime();
const createDebug = require("debug");
const http = require("http");
const app = require("./app/app");
const debug = createDebug('pecorino-api:server');
const port = normalizePort((process.env.PORT === undefined) ? '8081' : process.env.PORT);
app.set('port', port);
const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
server.keepAliveTimeout = (typeof process.env.NODE_KEEP_ALIVE_TIMEOUT === 'string') ? Number(process.env.NODE_KEEP_ALIVE_TIMEOUT) : 10000;
function normalizePort(val) {
    const portNumber = parseInt(val, 10);
    if (isNaN(portNumber)) {
        return val;
    }
    if (portNumber >= 0) {
        return portNumber;
    }
    return false;
}
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof port === 'string'
        ? `Pipe ${port}`
        : `Port ${port.toString()}`;
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
        default:
            throw error;
    }
}
function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? `pipe ${addr}`
        : `port ${addr === null || addr === void 0 ? void 0 : addr.port.toString()}`;
    debug(`Listening on ${bind}`);
    const diff = process.hrtime(startTime);
    debug(`api server listening took ${diff[0]} seconds and ${diff[1]} nanoseconds.`);
}
