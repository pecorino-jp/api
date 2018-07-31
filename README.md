# Pecorino API web application

[![CircleCI](https://circleci.com/gh/pecorino-jp/api.svg?style=svg)](https://circleci.com/gh/pecorino-jp/api)

## Table of contents

* [Usage](#usage)
* [License](#license)

## Usage

### Environment variables

| Name                          | Required | Value          | Purpose                    |
|-------------------------------|----------|----------------|----------------------------|
| `DEBUG`                       | false    | pecorino-api:* | Debug                      |
| `NPM_TOKEN`                   | true     |                | NPMトークン                    |
| `MONGOLAB_URI`                | true     |                | MongoDB接続文字列               |
| `TOKEN_ISSUERS`               | true     |                | Cognitoトークン発行者(カンマつなぎでリスト) |
| `RESOURECE_SERVER_IDENTIFIER` | true     |                | リソースサーバーとしての識別子            |

## License

ISC
