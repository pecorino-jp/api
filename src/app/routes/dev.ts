/**
 * devルーター
 */
import * as express from 'express';
const devRouter = express.Router();

import authentication from '../middlewares/authentication';

devRouter.use(authentication);

devRouter.get(
    '/500',
    () => {
        throw new Error('500 manually');
    });

devRouter.get(
    '/environmentVariables',
    (__, res) => {
        res.json({
            type: 'envs',
            attributes: process.env
        });
    });

export default devRouter;
