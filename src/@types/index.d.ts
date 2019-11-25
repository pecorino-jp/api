/**
 * middlewares/authenticationにて、expressのrequestオブジェクトにAPIユーザー情報を追加している。
 * ユーザーの型をここで定義しています。
 */
import * as pecorino from '@pecorino/domain';
import * as express from 'express';

declare global {
    namespace Express {
        export type IUser = pecorino.factory.clientUser.IClientUser;

        // tslint:disable-next-line:interface-name
        export interface Request {
            user: IUser;
            accessToken: string;
        }
    }
}
