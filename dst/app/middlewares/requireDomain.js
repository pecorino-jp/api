"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireDomain = void 0;
let domain;
function requireDomain(req, __, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (domain === undefined) {
                const domainModule = yield Promise.resolve().then(() => require('@chevre/domain'));
                domain = domainModule.chevre;
            }
            req.chevre = domain;
            next();
        }
        catch (error) {
            next(error);
        }
    });
}
exports.requireDomain = requireDomain;
