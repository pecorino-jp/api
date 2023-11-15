import { chevre } from '@chevre/domain';
import { NextFunction, Request, Response } from 'express';

let domain: typeof chevre | undefined;
export async function requireDomain(req: Request, __: Response, next: NextFunction) {
    try {
        if (domain === undefined) {
            const domainModule = await import('@chevre/domain');
            domain = domainModule.chevre;
        }

        req.chevre = domain;
        next();
    } catch (error) {
        next(error);
    }
}
