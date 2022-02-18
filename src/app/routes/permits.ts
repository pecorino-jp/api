/**
 * 許可証ルーター
 */
import { chevre } from '@cinerino/domain';
import * as createDebug from 'debug';
import { Router } from 'express';
import { body } from 'express-validator';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const debug = createDebug('pecorino-api:router');

const permitsRouter = Router();

// tslint:disable-next-line:no-suspicious-comment
// TODO findByAccessCodeで発行されたトークンでの照会が適切かもしれない
permitsRouter.post(
    '/findByIdentifier',
    permitScopes(['admin']),
    ...[
        body('project.id')
            .not()
            .isEmpty()
            .isString(),
        body('identifier')
            .not()
            .isEmpty()
            .isString(),
        body('issuedThrough.typeOf')
            .not()
            .isEmpty()
            .isString()
            .isIn([chevre.factory.product.ProductType.MembershipService, chevre.factory.product.ProductType.PaymentCard])
    ],
    validator,
    async (req, res, next) => {
        try {
            debug('permits findByIdentifier processing...body:', req.body);
            const permitRepo = new chevre.repository.Permit(mongoose.connection);
            const permit = await permitRepo.findByIdentifier(
                {
                    project: { id: { $eq: <string>req.body.project.id } },
                    identifier: { $eq: <string>req.body.identifier },
                    issuedThrough: {
                        typeOf: {
                            $eq: <chevre.factory.product.ProductType>req.body.issuedThrough.typeOf
                        }
                    }
                },
                { accessCode: 0 }
            );

            res.json(permit);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * accessCodeで照会
 */
permitsRouter.post(
    '/findByAccessCode',
    permitScopes(['admin']),
    ...[
        body('project.id')
            .not()
            .isEmpty()
            .isString(),
        body('identifier')
            .not()
            .isEmpty()
            .isString(),
        body('accessCode')
            .not()
            .isEmpty()
            .isString(),
        body('issuedThrough.typeOf')
            .not()
            .isEmpty()
            .isString()
            .isIn([chevre.factory.product.ProductType.MembershipService, chevre.factory.product.ProductType.PaymentCard])
    ],
    validator,
    async (req, res, next) => {
        try {
            const permitRepo = new chevre.repository.Permit(mongoose.connection);
            const permit = await permitRepo.findByIdentifierAndAccessCode(
                {
                    project: { id: { $eq: <string>req.body.project.id } },
                    accessCode: { $eq: <string>req.body.accessCode },
                    identifier: { $eq: <string>req.body.identifier },
                    issuedThrough: {
                        typeOf: {
                            $eq: <chevre.factory.product.ProductType>req.body.issuedThrough.typeOf
                        }
                    }
                },
                { accessCode: 0 }
            );

            res.json(permit);
        } catch (error) {
            next(error);
        }
    }
);

export default permitsRouter;
