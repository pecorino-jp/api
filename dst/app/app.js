"use strict";
const bodyParser = require("body-parser");
const express = require("express");
const helmet_1 = require("helmet");
const connectMongo_1 = require("../connectMongo");
const errorHandler_1 = require("./middlewares/errorHandler");
const notFoundHandler_1 = require("./middlewares/notFoundHandler");
const router_1 = require("./routes/router");
const app = express();
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ['\'self\'']
        }
    },
    hsts: {
        maxAge: 5184000,
        includeSubDomains: false
    },
    referrerPolicy: { policy: 'no-referrer' }
}));
const packageInfo = require('../../package.json');
app.use((__, res, next) => {
    res.setHeader('x-api-version', packageInfo.version);
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
(0, connectMongo_1.connectMongo)({ defaultConnection: true })
    .then()
    .catch((err) => {
    console.error('connetMongo:', err);
    process.exit(1);
});
app.use('/', router_1.router);
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
module.exports = app;
