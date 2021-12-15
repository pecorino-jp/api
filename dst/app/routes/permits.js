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
/**
 * 許可証ルーター
 */
const domain_1 = require("@cinerino/domain");
const createDebug = require("debug");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const debug = createDebug('pecorino-api:router');
const permitsRouter = (0, express_1.Router)();
// tslint:disable-next-line:no-suspicious-comment
// TODO findByAccessCodeで発行されたトークンでの照会が適切かもしれない
permitsRouter.post('/findByIdentifier', (0, permitScopes_1.default)(['admin']), ...[
    (0, express_validator_1.body)('project.id')
        .not()
        .isEmpty()
        .isString(),
    (0, express_validator_1.body)('identifier')
        .not()
        .isEmpty()
        .isString(),
    (0, express_validator_1.body)('issuedThrough.typeOf')
        .not()
        .isEmpty()
        .isString()
        .isIn([domain_1.chevre.factory.product.ProductType.MembershipService, domain_1.chevre.factory.product.ProductType.PaymentCard])
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        debug('permits findByIdentifier processing...body:', req.body);
        const permitRepo = new domain_1.chevre.repository.Permit(mongoose.connection);
        const permit = yield permitRepo.findByIdentifier({
            project: { id: { $eq: req.body.project.id } },
            identifier: { $eq: req.body.identifier },
            issuedThrough: {
                typeOf: {
                    $eq: req.body.issuedThrough.typeOf
                }
            }
        }, { accessCode: 0 });
        res.json(permit);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * accessCodeで照会
 */
permitsRouter.post('/findByAccessCode', (0, permitScopes_1.default)(['admin']), ...[
    (0, express_validator_1.body)('project.id')
        .not()
        .isEmpty()
        .isString(),
    (0, express_validator_1.body)('identifier')
        .not()
        .isEmpty()
        .isString(),
    (0, express_validator_1.body)('accessCode')
        .not()
        .isEmpty()
        .isString(),
    (0, express_validator_1.body)('issuedThrough.typeOf')
        .not()
        .isEmpty()
        .isString()
        .isIn([domain_1.chevre.factory.product.ProductType.MembershipService, domain_1.chevre.factory.product.ProductType.PaymentCard])
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const permitRepo = new domain_1.chevre.repository.Permit(mongoose.connection);
        const permit = yield permitRepo.findByIdentifierAndAccessCode({
            project: { id: { $eq: req.body.project.id } },
            accessCode: { $eq: req.body.accessCode },
            identifier: { $eq: req.body.identifier },
            issuedThrough: {
                typeOf: {
                    $eq: req.body.issuedThrough.typeOf
                }
            }
        }, { accessCode: 0 });
        res.json(permit);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = permitsRouter;
