/**
 * 取引期限監視
 */
import { chevre } from '@cinerino/domain';
import * as createDebug from 'debug';

import { connectMongo } from '../../../connectMongo';

const debug = createDebug('pecorino-api');

export default async () => {
    const connection = await connectMongo({ defaultConnection: false });

    let count = 0;

    const MAX_NUBMER_OF_PARALLEL_TASKS = 10;
    const INTERVAL_MILLISECONDS = 100;
    const transactionRepo = new chevre.repository.AccountTransaction(connection);

    setInterval(
        async () => {
            if (count > MAX_NUBMER_OF_PARALLEL_TASKS) {
                return;
            }

            count += 1;

            try {
                debug('transaction expiring...');
                await transactionRepo.makeExpired({ expires: new Date() });
            } catch (error) {
                // tslint:disable-next-line:no-console
                console.error(error);
            }

            count -= 1;
        },
        INTERVAL_MILLISECONDS
    );
};
