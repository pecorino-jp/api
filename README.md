<img src="https://motionpicture.jp/images/common/logo_01.svg" alt="motionpicture" title="motionpicture" align="right" height="56" width="98"/>

# PECORINO API web application

[![CircleCI](https://circleci.com/gh/motionpicture/pecorino-api.svg?style=svg&circle-token=a17f662cd12f7a182729d3f324dc4b3659379010)](https://circleci.com/gh/motionpicture/pecorino-api)

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

UNLICENSE
