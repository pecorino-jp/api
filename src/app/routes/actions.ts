/**
 * アクションルーター
 */
import * as pecorino from '@motionpicture/pecorino-domain';
import { Router } from 'express';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const actionsRouter = Router();

actionsRouter.use(authentication);

const actionRepo = new pecorino.repository.Action(pecorino.mongoose.connection);

/**
 * アクション検索
 */
actionsRouter.get(
    '',
    permitScopes(['admin']),
    (__1, __2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const accounts = await actionRepo.search({
                typeOf: req.query.typeOf,
                actionStatuses: req.query.actionStatuses,
                startDateFrom: req.query.startDateFrom,
                startDateThrough: req.query.startDateThrough,
                purposeTypeOfs: req.query.purposeTypeOfs,
                fromLocationAccountNumbers: req.query.fromLocationAccountNumbers,
                toLocationAccountNumbers: req.query.toLocationAccountNumbers,
                // tslint:disable-next-line:no-magic-numbers
                limit: (Number.isInteger(req.query.limit)) ? req.query.limit : 100
            });
            res.json(accounts);
        } catch (error) {
            next(error);
        }
    }
);

export default actionsRouter;
