/**
 * Expressアプリケーション
 */
import * as middlewares from '@motionpicture/express-middleware';
import * as pecorino from '@pecorino/domain';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as createDebug from 'debug';
import * as express from 'express';
import * as helmet from 'helmet';

import { connectMongo } from '../connectMongo';

import errorHandler from './middlewares/errorHandler';
import notFoundHandler from './middlewares/notFoundHandler';
import router from './routes/router';

const debug = createDebug('pecorino-api:*');

const app = express();

app.use(middlewares.basicAuth({ // ベーシック認証
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
    res.setHeader('x-api-version', <string>packageInfo.version);
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

// 静的ファイル
// app.use(express.static(__dirname + '/../../public'));

connectMongo({ defaultConnection: true })
    .then()
    .catch((err) => {
        // tslint:disable-next-line:no-console
        console.error('connetMongo:', err);
        process.exit(1);
    });

// routers
app.use('/', router);

// 404
app.use(notFoundHandler);

// error handlers
app.use(errorHandler);

export = app;
