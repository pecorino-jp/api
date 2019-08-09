# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).

## Unreleased

### Added

### Changed

- update mongoose

### Deprecated

### Removed

### Fixed

### Security

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
