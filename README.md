# Pecorino API Web Application

[![CircleCI](https://circleci.com/gh/pecorino-jp/api.svg?style=svg)](https://circleci.com/gh/pecorino-jp/api)

## Table of contents

* [Usage](#usage)
* [License](#license)

## Usage

### Environment variables

| Name                          | Required | Value          | Purpose                                |
| ----------------------------- | -------- | -------------- | -------------------------------------- |
| `DEBUG`                       | false    | pecorino-api:* | Debug                                  |
| `MONGOLAB_URI`                | true     |                | MongoDB connection settings            |
| `TOKEN_ISSUERS`               | true     |                | Cognito token issuers(comma separated) |
| `RESOURECE_SERVER_IDENTIFIER` | true     |                | Resource server identifier             |
| `JOBS_STOPPED`                | true     | 1 or 0         | Asynchronous tasks stopped or not      |

## License

ISC
