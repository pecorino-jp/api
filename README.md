<img src="https://motionpicture.jp/images/common/logo_01.svg" alt="motionpicture" title="motionpicture" align="right" height="56" width="98"/>

# PECORINO API web application

## Table of contents

* [Usage](#usage)
* [License](#license)

## Usage

### Environment variables

| Name                                | Required | Value                      | Purpose                     |
|-------------------------------------|----------|----------------------------|-----------------------------|
| `DEBUG`                             | false    | kwskfs-api-nodejs-client:* | Debug                       |
| `NPM_TOKEN`                         | true     |                            | NPMトークン                     |
| `MONGOLAB_URI`                      | true     |                            | MongoDB接続文字列                |
| `TOKEN_ISSUERS`                     | true     |                            | Cognitoトークン発行者              |
| `RESOURECE_SERVER_IDENTIFIER`       | true     |                            | リソースサーバーとしての識別子             |
| `COGNITO_USER_POOL_ID`              | true     |                            | CognitoユーザープールID            |
| `COGNITO_ATTRIBUTE_NAME_ACCOUNT_ID` | true     |                            | 口座IDを持たせるCognitoカスタムユーザー属性名 |
| `AWS_ACCESS_KEY_ID`                 | true     |                            | AWS access key id           |
| `AWS_SECRET_ACCESS_KEY`             | true     |                            | AWS secret access key       |

## License

UNLICENSE
