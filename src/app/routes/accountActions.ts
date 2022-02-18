/**
 * アクションルーター
 */
// import { chevre } from '@cinerino/domain';
import { Router } from 'express';
// import { query } from 'express-validator';
// import * as mongoose from 'mongoose';

// import permitScopes from '../middlewares/permitScopes';
// import validator from '../middlewares/validator';

const accountActionsRouter = Router();

/**
 * アクション検索
 */
// accountActionsRouter.get(
//     '',
//     permitScopes(['admin']),
//     ...[
//         query('startDateFrom')
//             .optional()
//             .isISO8601()
//             .toDate(),
//         query('startDateThrough')
//             .optional()
//             .isISO8601()
//             .toDate()
//     ],
//     validator,
//     async (req, res, next) => {
//         try {
//             const actionRepo = new chevre.repository.AccountAction(mongoose.connection);
//             const actions = await actionRepo.search({
//                 ...req.query,
//                 // tslint:disable-next-line:no-magic-numbers
//                 limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
//                 page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
//             });

//             res.json(actions);
//         } catch (error) {
//             next(error);
//         }
//     }
// );

/**
 * 転送アクション検索
 */
// accountActionsRouter.get(
//     '/moneyTransfer',
//     permitScopes(['admin']),
//     ...[
//         query('startDate.$gte')
//             .optional()
//             .isISO8601()
//             .toDate(),
//         query('startDate.$lte')
//             .optional()
//             .isISO8601()
//             .toDate()
//     ],
//     validator,
//     async (req, res, next) => {
//         try {
//             const searchConditions: chevre.factory.account.action.moneyTransfer.ISearchConditions = {
//                 ...req.query,
//                 // tslint:disable-next-line:no-magic-numbers
//                 limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
//                 page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
//             };

//             const actionRepo = new chevre.repository.AccountAction(mongoose.connection);
//             const actions = await actionRepo.searchTransferActions(searchConditions);

//             res.json(actions);
//         } catch (error) {
//             next(error);
//         }
//     }
// );

export default accountActionsRouter;
