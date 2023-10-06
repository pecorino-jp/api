/**
 * 404ハンドラーミドルウェア
 */
import { NextFunction, Request, Response } from 'express';

export function notFoundHandler(req: Request, __: Response, next: NextFunction) {
    next(new req.chevre.factory.errors.NotFound(`router for [${req.originalUrl}]`));
}
