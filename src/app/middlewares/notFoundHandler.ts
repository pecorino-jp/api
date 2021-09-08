/**
 * 404ハンドラーミドルウェア
 */
import { chevre } from '@cinerino/domain';
import { NextFunction, Request, Response } from 'express';

export default (req: Request, __: Response, next: NextFunction) => {
    next(new chevre.factory.errors.NotFound(`router for [${req.originalUrl}]`));
};
