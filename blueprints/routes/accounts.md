# Data Structure

## Account

+ accountNumber: `12345678` - 口座番号
+ name: `MOTION TARO` - 口座名義

## MoneyTransferAction

+ id: `123456789` - アクションID

# Group 口座エンドポイント

## 口座 [/accounts]

### 口座検索 [GET]

口座を検索します。

+ Response 200 (application/json)
    + Attributes (array[Account], fixed-type)
        + data: (Account) - 口座リスト

<!-- include(../response/400.md) -->

### 口座開設 [POST]

口座を新しく解説します。

+ Response 204 (application/json)
    + Attributes (Account)

<!-- include(../response/400.md) -->

## 口座解約 [/accounts/{accountNumber}/close]

### 口座解約 [PUT]

口座を解約します。

+ Response 204 (application/json)

<!-- include(../response/400.md) -->

## 口座の取引検索 [/accounts/{accountNumber}/actions/moneyTransfer]

### 口座の取引検索 [GET]

口座で処理された取引を検索します。

+ Response 200 (application/json)
    + Attributes (array[MoneyTransferAction], fixed-type)
        + data: (MoneyTransferAction) - 取引リスト

<!-- include(../response/400.md) -->
