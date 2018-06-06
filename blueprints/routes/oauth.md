# Group OAuth認証

## トークンエンドポイント [/oauth2/token]

### アクセストークン発行 [POST]

[OAuth2](https://tools.ietf.org/html/rfc6749) に準拠したトークンエンドポイントです。
認可サーバーはAmazonCognitoが担当しています。

::: note
エンドポイントは、

`https://<domain-name>.auth.ap-northeast-1.amazoncognito.com/token`

となります。
:::

詳細については[AWSドキュメント](https://docs.aws.amazon.com/ja_jp/cognito/latest/developerguide/token-endpoint.html)を参照してください。

#### 利用可能な認可タイプ

+ `client_credentials`

認証時には必要なスコープを必ず指定してください。

#### 利用可能なスコープ

| scope | description |
|-------|-------------|
| admin | 管理者としての操作   |

+ Request クライアント認証 (application/x-www-form-urlencoded)
    +  Headers
        Authorization: Basic ABC123
    + Attributes
        + `grant_type`: `client_credencials` (string, required) - 認証タイプ(固定値)
        + `state`: `state123456789` (string, required)
            クライアント状態(クライアント側で現在のユーザー状態を表す文字列を送信してください。例えばセッションIDなどです)
        + `scopes` (array, fixed-type, required) - 必要なスコープは、各APIの説明を参照してください。
            + `https://ttts-api-development-azurewebsites.net/transactions` (string)
            + `https://ttts-api-development-azurewebsites.net/performances.read-only` (string)

+ Response 200 (application/json)
    + Attributes
        + access_token: `JWT` (string, required) - アクセストークン
        + token_type: `Bearer` (string, required) - 発行されたトークンタイプ
        + expires_in: 1800 (number, required) - アクセストークンの有効期間

<!-- include(../response/400.md) -->
