# WAO属性仕様

----
## データを追加するには
* formをpostメソッドで送信する
* フォームのname属性は、[コレクション名].[プロパティ名]とする  

```
    <form method="post">
      <input name="[collection].[property]" />
    </form>
```


## データを取得するには（検索条件指定）
* getメソッドでリクエストを送信する
* 検索条件は、クエリストリングで指定する
* パラメータキーは、[コレクション名].[プロパティ名]とする

```
  ?collection.property=value
```

* 検索条件にidが指定する場合
```
    ?collection.id=123
```
## データを取得するには（検索条件なし）
* getメソッドでリクエストを送信する
* 検索条件なしで全件を取得する場合、[コレクション名]=allを指定する
```
    ?collection=all
```
## データを表示するには（innerHTML）
* data-wao-bind属性にコレクション名.プロパティ名を指定する
```
    <tag data-wao-bind="collection.property">hoge</tag>
```

* レンダリング後は、data-wao-bind属性が削除され、innerHtmlが書き変わる
```
    <tag>value</tag>
```

## 指定の属性を置換する
* data-wao-bind-[属性名]属性にコレクション名.プロパティ名を指定する
```
    <tag data-wao-bind-class="collection.property">hoge</tag>
```

* 実行後、data-wao-bind-[属性名]属性が削除され、[属性名]で指定した属性が書き変わる
```
    <tag class="value">hoge</tag>
```

## getパラメタを書き換えるには
* href属性のクエリストリングのパラメータキーにコレクション名.プロパティ名を指定する(値は指定しない)
```
    <a href="foobar.html?collection.property=">hoge</a>
```

* 実行後、イコールの後ろに値が設定される
```
    <a href="foobar.html?collection.property=value">hoge</a>
```

## データを繰り返し表示するには
* data-wao-iterator属性にコレクション名を指定する
* 子要素でbind指定する
```
    <parent data-wao-iterator="collection">
      <child data-wao-bind="collection.property">hoge</child>
    </parent>
```

* 実行後、iterator属性を含む要素が繰り返し生成される
```
    <parent>
      <child>value1</child>
    </parent>
    <parent>
      <child>value2</child>
    </parent>
```

## サンプルアプリ
上記に記載された属性は、全てサンプルアプリで使用していますので、そちらもご参照ください。

[サンプルアプリ](https://github.com/yujiroarai/node-wao/raw/master/chousei_wao.zip)