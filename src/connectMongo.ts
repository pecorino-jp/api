/**
 * mongooseコネクション確立
 */
import * as createDebug from 'debug';
import * as mongoose from 'mongoose';

const debug = createDebug('pecorino-api:*');
const PING_INTERVAL = 10000;
const connectOptions = {
    autoReconnect: true,
    keepAlive: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 0,
    reconnectTries: 30,
    reconnectInterval: 1000
};

export async function connectMongo() {
    // コネクション確立
    await mongoose.connect(<string>process.env.MONGOLAB_URI, connectOptions);

    // 定期的にコネクションチェック
    // tslint:disable-next-line:no-single-line-block-comment
    /* istanbul ignore next */
    setInterval(
        async () => {
            // すでに接続済かどうか
            if (mongoose.connection.readyState === 1) {
                // 接続済であれば疎通確認
                let pingResult: any;
                try {
                    pingResult = await mongoose.connection.db.admin().ping();
                    debug('pingResult:', pingResult);
                } catch (error) {
                    // tslint:disable-next-line:no-console
                    console.error('ping:', error);
                }

                // 疎通確認結果が適性であれば何もしない
                if (pingResult !== undefined && pingResult.ok === 1) {
                    return;
                }
            }

            // コネクション確立
            try {
                await mongoose.connect(<string>process.env.MONGOLAB_URI, connectOptions);
                debug('MongoDB connected!');
            } catch (error) {
                // tslint:disable-next-line:no-console
                console.error('mongoose.connect:', error);
            }
        },
        PING_INTERVAL
    );
}
