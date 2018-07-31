/**
 * 404ハンドラーミドルウェア
 * @module middlewares.notFoundHandler
 */

import * as pecorino from '@pecorino/domain';
import { NextFunction, Request, Response } from 'express';

export default (req: Request, __: Response, next: NextFunction) => {
    next(new pecorino.factory.errors.NotFound(`router for [${req.originalUrl}]`));
};
