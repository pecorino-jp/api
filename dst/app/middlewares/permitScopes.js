"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permitScopes = void 0;
const createDebug = require("debug");
const debug = createDebug('pecorino-api:middlewares:permitScopes');
function permitScopes(permittedScopes) {
    return (req, __, next) => {
        if (process.env.RESOURCE_SERVER_IDENTIFIER === undefined) {
            next(new Error('RESOURCE_SERVER_IDENTIFIER undefined'));
            return;
        }
        debug('req.user.scopes:', req.user.scopes);
        const permittedScopesWithResourceServerIdentifier = [
            ...permittedScopes.map((permittedScope) => `${process.env.RESOURCE_SERVER_IDENTIFIER}/${permittedScope}`),
            ...permittedScopes.map((permittedScope) => `${process.env.RESOURCE_SERVER_IDENTIFIER}/auth/${permittedScope}`)
        ];
        debug('permittedScopesWithResourceServerIdentifier:', permittedScopesWithResourceServerIdentifier);
        try {
            debug('checking scope requirements...', permittedScopesWithResourceServerIdentifier);
            if (!isScopesPermitted(req.user.scopes, permittedScopesWithResourceServerIdentifier)) {
                next(new req.chevre.factory.errors.Forbidden('scope requirements not satisfied'));
            }
            else {
                next();
            }
        }
        catch (error) {
            next(error);
        }
    };
}
exports.permitScopes = permitScopes;
function isScopesPermitted(ownedScopes, permittedScopes) {
    debug('checking scope requirements...', permittedScopes);
    if (!Array.isArray(ownedScopes)) {
        throw new Error('ownedScopes should be array of string');
    }
    const permittedOwnedScope = permittedScopes.find((permittedScope) => ownedScopes.indexOf(permittedScope) >= 0);
    return (permittedOwnedScope !== undefined);
}
