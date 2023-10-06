/**
 * middlewares/authenticationにて、expressのrequestオブジェクトにAPIユーザー情報を追加している。
 * ユーザーの型をここで定義しています。
 */
import { chevre } from '@chevre/domain';

declare global {
    namespace Express {
        export type IUser = chevre.factory.clientUser.IClientUser;

        // tslint:disable-next-line:interface-name
        export interface Request {
            user: IUser;
            accessToken: string;
            chevre: typeof chevre;
        }
    }
}
