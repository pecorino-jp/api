# Data Structure

## Action

+ typeOf: `MoneyTransfer` - アクションタイプ

# Group アクションエンドポイント

## アクション [/actions]

### アクション検索 [GET]

アクションを検索します。

+ Response 200 (application/json)
    + Attributes (array[Action], fixed-type)
        + data: (Action) - アクションリスト

<!-- include(../response/400.md) -->
