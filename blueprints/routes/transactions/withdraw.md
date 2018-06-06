# Data Structure

## WithdrawTransaction

+ id: `59119065e3157c1884d3c333` (string, required) - 取引ID
+ agent: (object, required) - 取引進行者
+ expires: `2017-05-10T07:42:25Z` (string, required) - 取引期限
+ startDate: `2017-05-10T07:42:25Z` (string, required) - 取引開始日時

# Group 出金取引エンドポイント

## 出金取引開始 [/transactions/withdraw/start]

### 出金取引開始 [POST]
出金取引を開始します。取引の期限が切れると取引を確定することはできなくなります。
アプリケーション側で十分な期間を想定し、期限をセットしてください。

::: note
This action requires an `access_token` with `admin` scope.
:::

+ Request (application/json)
    + Headers
        Authentication: Bearer JWT
    + Attributes
        + expires:  `2017-05-10T07:42:25Z` (string, required) - 取引有効期限

+ Response 200 (application/json)
    + Attributes (WithdrawTransaction)

<!-- include(../../response/400.md) -->
<!-- include(../../response/404.md) -->

## 出金取引確定 [/transactions/withdraw/{transactionId}/confirm]

+ Parameters
    + transactionId: `59119065e3157c1884d3c333` (string, required) - 取引ID

### 出金取引確定 [PUT]
出金取引を確定します。有効期限を超過していた場合、ステータスコード400を返却します。

::: note
This action requires an `access_token` with `admin` scope.
:::

+ Request (application/json)
    + Headers
        Authentication: Bearer JWT
    + Attributes

+ Response 204 (application/json)

<!-- include(../../response/400.md) -->
<!-- include(../../response/404.md) -->

## 出金取引中止 [/transactions/withdraw/{transactionId}/cancel]

+ Parameters
    + transactionId: `59119065e3157c1884d3c333` (string, required) - 取引ID

### 出金取引中止 [PUT]
出金取引を中止します。すでに確定済の場合、ステータスコード400を返却します。

::: note
This action requires an `access_token` with `admin` scope.
:::

+ Request (application/json)
    + Headers
        Authentication: Bearer JWT
    + Attributes

+ Response 204 (application/json)

<!-- include(../../response/400.md) -->
<!-- include(../../response/404.md) -->
