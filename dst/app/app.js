"use strict";
/**
 * Expressアプリケーション
 * @ignore
 */
const middlewares = require("@motionpicture/express-middleware");
const pecorino = require("@motionpicture/pecorino-domain");
const bodyParser = require("body-parser");
const cors = require("cors");
const createDebug = require("debug");
const express = require("express");
const expressValidator = require("express-validator");
const helmet = require("helmet");
const mongooseConnectionOptions_1 = require("../mongooseConnectionOptions");
const errorHandler_1 = require("./middlewares/errorHandler");
const notFoundHandler_1 = require("./middlewares/notFoundHandler");
const accounts_1 = require("./routes/accounts");
const dev_1 = require("./routes/dev");
const health_1 = require("./routes/health");
// import myAccountsRouter from './routes/me/accounts';
const deposit_1 = require("./routes/transactions/deposit");
const pay_1 = require("./routes/transactions/pay");
const transfer_1 = require("./routes/transactions/transfer");
const debug = createDebug('pecorino-api:*');
const app = express();
app.use(middlewares.basicAuth({
    name: process.env.BASIC_AUTH_NAME,
    pass: process.env.BASIC_AUTH_PASS,
    unauthorizedHandler: (__, res, next) => {
        res.setHeader('WWW-Authenticate', 'Basic realm="pecorino-api Authentication"');
        next(new pecorino.factory.errors.Unauthorized());
    }
}));
app.use(cors()); // enable All CORS Requests
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ['\'self\'']
        // styleSrc: ['\'unsafe-inline\'']
    }
}));
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
const SIXTY_DAYS_IN_SECONDS = 5184000;
app.use(helmet.hsts({
    maxAge: SIXTY_DAYS_IN_SECONDS,
    includeSubdomains: false
}));
// api version
// tslint:disable-next-line:no-require-imports no-var-requires
const packageInfo = require('../../package.json');
app.use((__, res, next) => {
    res.setHeader('x-api-verion', packageInfo.version);
    next();
});
// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
    // サーバーエラーテスト
    app.get('/dev/uncaughtexception', (req) => {
        req.on('data', (chunk) => {
            debug(chunk);
        });
        req.on('end', () => {
            throw new Error('uncaughtexception manually');
        });
    });
}
// view engine setup
// app.set('views', `${__dirname}/views`);
// app.set('view engine', 'ejs');
app.use(bodyParser.json());
// The extended option allows to choose between parsing the URL-encoded data
// with the querystring library (when false) or the qs library (when true).
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator({})); // this line must be immediately after any of the bodyParser middlewares!
// 静的ファイル
// app.use(express.static(__dirname + '/../../public'));
pecorino.mongoose.connect(process.env.MONGOLAB_URI, mongooseConnectionOptions_1.default)
    .then(() => {
    debug('MongoDB connected.');
})
    .catch(console.error);
// routers
app.use('/accounts', accounts_1.default);
app.use('/health', health_1.default);
app.use('/transactions/deposit', deposit_1.default);
app.use('/transactions/pay', pay_1.default);
app.use('/transactions/transfer', transfer_1.default);
// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
    app.use('/dev', dev_1.default);
}
// 404
app.use(notFoundHandler_1.default);
// error handlers
app.use(errorHandler_1.default);
module.exports = app;
