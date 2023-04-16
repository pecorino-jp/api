export const TOKEN_ISSUER_REQUEST_TIMEOUT: number = (typeof process.env.TOKEN_ISSUER_REQUEST_TIMEOUT === 'string')
    ? Number(process.env.TOKEN_ISSUER_REQUEST_TIMEOUT)
    // tslint:disable-next-line:no-magic-numbers
    : 5000;
// 許可発行者リスト
export const TOKEN_ISSUERS = (<string>process.env.TOKEN_ISSUERS).split(' ');
