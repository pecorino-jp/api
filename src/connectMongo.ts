/**
 * MongoDBコネクション確立
 */
import * as createDebug from 'debug';
import * as mongoose from 'mongoose';

const debug = createDebug('pecorino-api:connectMongo');
const MONGOLAB_URI = <string>process.env.MONGOLAB_URI;
const AUTO_INDEX = process.env.MONGO_AUTO_INDEX_DISABLED !== '1';

const MONGO_PING_INTERVAL_MS = (typeof process.env.MONGO_PING_INTERVAL_MS === 'string')
    // tslint:disable-next-line:no-single-line-block-comment
    /* istanbul ignore next */
    ? Number(process.env.MONGO_PING_INTERVAL_MS)
    // tslint:disable-next-line:no-magic-numbers
    : 30000;
// tslint:disable-next-line:no-magic-numbers
const MONGO_PING_TIMEOUT_MS = (typeof process.env.MONGO_PING_TIMEOUT_MS === 'string')
    // tslint:disable-next-line:no-single-line-block-comment
    /* istanbul ignore next */
    ? Number(process.env.MONGO_PING_TIMEOUT_MS)
    // tslint:disable-next-line:no-magic-numbers
    : 10000;

const connectOptions: mongoose.ConnectOptions = {
    autoIndex: AUTO_INDEX,
    // autoReconnect: true,
    keepAlive: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000
    // reconnectTries: 30,
    // reconnectInterval: 1000,
    // useCreateIndex: true,
    // useFindAndModify: false,
    // useNewUrlParser: true,
    // useUnifiedTopology: true
};

export async function connectMongo(params: {
    defaultConnection: boolean;
    disableCheck?: boolean;
}) {
    let connection: mongoose.Connection;
    if (params === undefined || params.defaultConnection) {
        // コネクション確立
        await mongoose.connect(MONGOLAB_URI, connectOptions);
        connection = mongoose.connection;
    } else {
        connection = mongoose.createConnection(MONGOLAB_URI, connectOptions);
        // .asPromise();
    }

    // 定期的にコネクションチェック
    // tslint:disable-next-line:no-single-line-block-comment
    /* istanbul ignore next */
    if (params.disableCheck === undefined || params.disableCheck === false) {
        setInterval(
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore next */
            async () => {
                // すでに接続済かどうか
                if (connection.readyState === 1) {
                    // 接続済であれば疎通確認
                    let pingResult: any;
                    await new Promise<void>((resolve) => {
                        try {
                            connection.db.admin()
                                .ping()
                                .then((result) => {
                                    pingResult = result;
                                    debug('pingResult:', pingResult);
                                })
                                .catch((error) => {
                                    // tslint:disable-next-line:no-console
                                    console.error('ping error:', error);
                                });
                        } catch (error) {
                            // tslint:disable-next-line:no-console
                            console.error('connection.db.admin() error:', error);
                        }

                        // tslint:disable-next-line:no-magic-numbers
                        setTimeout(() => { resolve(); }, MONGO_PING_TIMEOUT_MS);
                    });

                    // 疎通確認結果が適性であれば何もしない
                    if (pingResult !== undefined && pingResult.ok === 1) {
                        return;
                    }
                }

                try {
                    // コネクション再確立
                    await connection.close();
                    await connection.openUri(MONGOLAB_URI, connectOptions);
                    debug('MongoDB reconnected!');
                } catch (error) {
                    // tslint:disable-next-line:no-console
                    console.error('mongoose.connect:', error);
                }
            },
            MONGO_PING_INTERVAL_MS
        );
    }

    return connection;
}
