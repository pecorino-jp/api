# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).

## Unreleased

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## v7.0.1 - 2024-05-29

### Changed

- update @chevre/domain
- update @motionpicture/express-middleware

## v7.0.0 - 2023-11-15

### Added

- add requireDomain middleware

### Changed

- mongoose.Schemaインスタンス生成をリポジトリインスタンス生成時に変更
- update @chevre/domain
- update @motionpicture/express-middleware

### Removed

- delete /ssktsMembershipCoupon
- delete /ssktsSurfrock

## v6.3.1 - 2023-09-22

### Changed

- update @chevre/domain

## v6.3.0 - 2023-09-15

### Changed

- update @chevre/domain
- update mongoose@7.x.x

## v6.2.1 - 2023-04-16

### Changed

- update redis@4.x.x
- update typescript@5.x.x

## v6.2.0 - 2023-04-07

### Changed

- update helmet@6.x.x
- update mongoose@6.x.x
- mongooseモデルのindexイベントハンドラーをconnectionごとに管理するように調整
- MongoErrorハンドリングをMongoServerErrorにも拡張

### Fixed

- MongoDBクエリのskipに負の値が指定される脆弱性に対応

## v6.1.0 - 2023-03-27

### Added

- ssktsMembershipCouponIFを追加
- ssktsSurfrockIFを追加

## v6.0.0 - 2023-03-06

### Changed

- 口座取引におけるAccountAction管理を廃止
- 口座からstatusを廃止
- 口座取開始レスポンス最適化

## v5.17.0 - 2022-11-15

### Added

- 口座取引検索を追加
- cleanUpDatabaseをcron化

### Changed

- ACCOUNT_TRANSACTION_STORAGE_PERIOD_IN_MONTH設定を追加
- accountTransactionsコレクションのindex最適化
- 口座取引確定サービスを同期型に変更
- 口座取引中止サービスを同期型に変更
- IDによる口座取引確定を廃止
- IDによる口座取引中止を廃止
- 口座取引開始前にfromLocationの利用可能残高検証を追加
- @chevre/domainで再実装

### Removed

- abortTasksを削除
- retryTasksを削除
- onAccountTransactionConfirmedを廃止
- onAccountTransactionCanceledを廃止
- onAccountTransactionExpiredを廃止
- jobsを削除

## v5.16.0 - 2022-09-28

### Added

- 汎用口座取引開始を追加
- 汎用口座取引確定を追加
- 汎用口座取引中止を追加

### Changed

- 取引タイプごとの口座取引タスクエクスポート処理を統合
- update @motionpicture/express-middleware
- 口座取引の取引番号指定を必須化
- 口座転送アクション実行後に口座取引クリーン処理を追加

### Removed

- 取引タイプ別口座取引サービスを削除

## v5.15.0 - 2022-09-13

### Added

- NODE_KEEP_ALIVE_TIMEOUT設定を追加

### Changed

- no-default-export: true
- update @cinerino/domain

## v5.14.0 - 2022-07-22

### Changed

- 各コレクションのproject.idへ再インデックス
- update mongoose

## v5.13.0 - 2022-05-19

### Changed

- 出金取引開始パラメータにforceを追加
- update @cinerino/domain

## v5.12.2 - 2022-04-06

### Fixed

- 転送アクションのagent.urlとrecipient.urlがnullになる状態を解消

## v5.12.1 - 2022-04-06

### Changed

- spread operatorによるオブジェクト展開を厳密なコーディングに変換

## v5.12.0 - 2022-02-18

### Added

- Permitサービスを追加

### Removed

- 口座ルーターを廃止
- 口座アクションルーターを廃止

## v5.11.1 - 2021-10-31

- update @cinerino/domain

## v5.11.0 - 2021-09-27

### Changed

- 口座ルーティングを最適化(:accountTypeを削除)

## v5.10.1 - 2021-09-13

### Changed

- @cinerino/domainで再実装

## v5.10.0 - 2021-09-03

### Changed

- 口座アクションクリーニング処理を追加

## v5.9.2 - 2021-07-05

### Changed

- 各リソースのプロジェクトID検索条件指定を最適化($exists: trueを削除)

## v5.9.1 - 2021-06-24

### Changed

- update @chevre/domain

## v5.9.0 - 2021-06-02

### Changed

- 取引の金額型を拡張
- 取引開始時の旧パラメータ対応を廃止
- 口座アクション検索の旧amount型に対する互換性維持対応を削除

## v5.8.0 - 2021-05-24

### Changed

- 不要なインターフェースを削除
- タスク名を再定義
- アクションを口座アクションに変換
- 取引を口座取引に変換
- タスクサービスをchevreに仕様統合
- @chevre/factoryで再構築
- Chevreとのリポジトリ名重複を解決
- 口座アクションのコレクション名変更
- 口座取引のコレクション名変更
- 全リポジトリを@chevre/domainからのインポートで再構築
- 口座取引サービスをaccountTransactionにリネーム
- @chevre/domainで再構築

### Removed

- 返金タスクを削除

## v5.7.2 - 2020-12-22

### Fixed

- 口座開設時に初期金額が適用されないバグ対応

## v5.7.1 - 2020-12-20

### Changed

- 同識別子に対して進行中取引のユニークネスを保証するように調整

## v5.7.0 - 2020-12-10

### Changed

- 同識別子に対して進行中取引のユニークネスを保証するように調整
- MoneyTransferアクション検索条件拡張
- ヘルスチェックを調整

## v5.6.0 - 2020-11-10

### Changed

- MoneyTransferアクションのamountがMonetaryAmount型の場合に対応
- アクション検索条件拡張

## v5.5.0 - 2020-11-04

### Changed

- 口座検索条件拡張
- 口座開設を複数口座に対応
- update mongoose
- update express-validator
- update @pecorino/domain

## v5.4.0 - 2020-09-24

### Changed

- update @pecorino/factory
- 口座番号をグローバルユニークに変更
- 口座に対する処理を口座番号の指定のみで実行するように調整
- 処理は口座のtypeOfに依存しないように調整

### Removed

- ベーシック認証設定を削除

## v5.3.0 - 2020-05-19

### Added

- アクションにidentifierを追加
- 取引の返金処理を追加

## v5.2.0 - 2020-05-14

### Added

- 取引に取引番号を追加

### Changed

- 取引番号にて取引ステータスを変更できるように調整

## v5.1.0 - 2020-03-31

### Changed

- 取引タイプごとの転送アクション属性作成処理を統一
- 取引開始時に転送アクションを開始するように変更
- 口座検索条件拡張
- アクション検索条件拡張
- 取引処理を最適化
- 転送取引開始時の口座間比較バリデーションを追加
- install express-validator@6.4.0

## v5.0.0 - 2020-03-27

### Changed

- 各リソース検索からX-Total-Countを削除
- MongoDBコネクション監視調整

## v4.0.1 - 2019-11-27

### Changed

- デバッグ調整

## v4.0.0 - 2019-11-26

### Changed

- 口座にプロジェクト属性を追加
- アクションにプロジェクト属性を追加
- タスクにプロジェクト属性を追加
- 取引にプロジェクト属性を追加
- 全コレクションにプロジェクト属性へのインデックスを追加
- 口座検索条件を拡張
- アクション検索条件を拡張
- 口座開設時のプロジェクト指定を必須化
- 取引開始時のプロジェクト指定を必須化

## v3.2.2 - 2019-08-19

### Added

- Add process.json

## v3.2.1 - 2019-08-16

### Changed

- update mongoose

## v3.2.0 - 2019-06-21

### Added

- 口座編集エンドポイントを追加

## v3.1.1 - 2019-03-27

### Changed

- インデックスが効くように、タスクコレクションに対するクエリを調整

## v3.1.0 - 2019-03-15

### Added

- 転送アクション検索を追加

### Changed

- 口座、アクション、タスク、取引コレクションのインデックス調整

## v3.0.0 - 2019-03-12

### Changed

- 非同期タスクを統合
- 取引確定&中止時の非同期処理実行レイテンシを改善

## v2.0.0 - 2019-02-19

### Changed

- MongoDBインデックス調整
- install @pecorino/domain@2.0.0

## v1.0.1 - 2018-10-09

### Changed

- 口座検索と取引履歴検索にページネーション追加。

## v1.0.0 - 2018-07-31

### Changed

- MongoDBとの接続の疎通確認処理を追加。
- 口座に口座タイプ属性を追加。

## v0.0.1 - 2018-06-07

### Changed

- 口座開設時にバリデーションを強化。
- 取引開始時パラメーター汎用性向上。

## v0.0.0 - 2018-06-06

### Added

- 口座照会エンドポイントを追加。
- 支払取引エンドポイントを追加。
- 入金取引エンドポイントを追加。
- 口座解約エンドポイントを追加。
