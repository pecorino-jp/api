# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).

## Unreleased

### Added

### Changed

- 各リソース検索からX-Total-Countを削除

### Deprecated

### Removed

### Fixed

### Security

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
