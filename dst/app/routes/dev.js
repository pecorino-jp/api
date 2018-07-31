"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * devルーター
 */
const express = require("express");
const devRouter = express.Router();
const authentication_1 = require("../middlewares/authentication");
devRouter.use(authentication_1.default);
devRouter.get('/500', () => {
    throw new Error('500 manually');
});
devRouter.get('/environmentVariables', (__, res) => {
    res.json({
        type: 'envs',
        attributes: process.env
    });
});
exports.default = devRouter;
