/**
 * タスク中止
 */
import * as chevre from '@chevre/domain';
import * as moment from 'moment';

import { connectMongo } from '../../../connectMongo';

export default async () => {
    const connection = await connectMongo({ defaultConnection: false });

    let count = 0;

    const MAX_NUBMER_OF_PARALLEL_TASKS = 10;
    const INTERVAL_MILLISECONDS = 1000;
    const RETRY_INTERVAL_MINUTES = 10;
    const taskRepo = new chevre.repository.Task(connection);

    setInterval(
        async () => {
            if (count > MAX_NUBMER_OF_PARALLEL_TASKS) {
                return;
            }

            count += 1;

            try {
                await chevre.service.task.abort({ intervalInMinutes: RETRY_INTERVAL_MINUTES })({ task: taskRepo });

                // 過去の不要なタスクを削除
                await taskRepo.taskModel.deleteMany({
                    runsAt: {
                        $lt: moment()
                            // tslint:disable-next-line:no-magic-numbers
                            .add(-7, 'days')
                            .toDate()
                    },
                    status: { $in: [chevre.factory.taskStatus.Aborted, chevre.factory.taskStatus.Executed] }
                })
                    .exec();
            } catch (error) {
                // tslint:disable-next-line:no-console
                console.error(error);
            }

            count -= 1;
        },
        INTERVAL_MILLISECONDS
    );
};
