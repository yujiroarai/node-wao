# WAOって何！？

WAO（ワオ）とは、サーバーサイドの開発を全く行わずに、htmlにwao属性を埋め込むだけでWebシステムを構築できるミドルウェアです。

# AQUAって何？
AQUA（アクア）とは、WAO専用の統合開発環境です。
AQUAを使用することでローカルの開発環境構築が不要となります。

# チュートリアル

まずはWAOを用いて簡単なシステムを作りながら、WAOについて学んで行きましょう。

概要は以下の流れとなります。

* １.HTMLの準備
* ２.HTMLへWAO属性を埋め込む
* ３.統合開発環境AQUAにHTMLをアップロード
* ４.アプリ起動！


## １.HTMLの準備
まずはHTMLを作成しましょう。
今回は以下のような簡単なサンプルを作ります。

よくある感じのスケジュール調整アプリです。

###今回作成するサンプルアプリの仕様

スケジュール調整アプリ 機能概要

* イベントを作成する（イベント名、日程などを登録できる）
* 作成したイベントに、みんなが参加／不参加をする

サンプルhtmlを用意したので以下のURLからダウンロードしてください。

[スケジュール調整アプリサンプルhtml](http://google.com "サンプル")



## ２.HTMLへWAO属性を埋め込む
HTMLの準備ができたら、WAO属性を組み込みます。

### イベント登録ページ

まずはサンプルのindex.htmlを開いてみましょう。

![イベントページの画像](./img/event01.png)

はい、良くあるスケジュール調整ツールですね。

イベント名や候補日程を入力でき、「イベントを作る」ボタン押下でDBに値を登録し完了画面へ遷移します。

WAOのすごいところは、この「DBに値を登録する」というサーバーサイドの処理を、HTMLに属性を組み込むだけで実現できちゃうことにあります。

では、まずはイベント名を入力する部分のHTMLを見てみましょう。

```
<form role="form" action="schedule/newEvent/create.html" method="post">
  <div class="col-md-4">
    <div class="form-group">
      <label for="event">イベント名</label>&nbsp;
      <span class="label label-danger">必須</span><br>
      <small>※今期もお疲れ様でした飲み会、打ち合わせなど</small>
      <input type="text" class="form-control" name="event.name" placeholder="イベント名を入力してください">
    </div>
  </div>
</form>
```

こんな感じです。

ごく普通のHTMLですね。

ここに登録されたイベント名にWAO属性を追加することで、入力されたイベント名をDBに登録させるようにします。

```
<input type="text" class="form-control" placeholder="イベント名を入力してください">
```

この部分にname属性を以下のように足すだけです。

```
<input type="text" class="form-control" name="event.name" placeholder="イベント名を入力してください">
```

はい、これでできちゃいました。

簡単です。

さて、_name="event.name"_を追加しましたが、これはどんな意味でしょう？

これがWAO属性と呼ばれるもので、

name=[コレクション名].[フィールド名]

となっています。

この場合は

__eventというコレクションのnameというフィールドにinputタグに入力された情報を表示する__

という意味になります。

これで入力されたイベントをDBに登録できるようになりました。

同じようにメモやスケジュールも登録しましょう^^

属性を埋め込んだサンプルhtmlはこちらです。

[index.htmlに属性を埋め込んだ版](http://google.com "index.htmlに属性を埋め込んだ版")



### イベント登録完了ページ

お次は登録後に遷移する完了画面を作成しょう。

サンプルのcomplete.htmlをブラウザで開いてみましょう。

![イベントページの画像](./img/event02.png)

こんな感じ。

完了のメッセージと、確認のためにさっきイベント登録画面で登録した内容を表示していますね。

さて、イベント名、メモ、候補日程を表示したいのですが、WAOではこれらをどのようにDBから取得して表示すれば良いのでしょう？

WAOでは以下のようにリクエストパラメータで判断します。

http://localhost:8765/schedule/newEvent/complete.html?event.id=14179351307431885

こんな感じ。

さっきは登録画面でDBにコレクション名eventとして各項目を登録しました。

今度はそのときに払い出されたidをリクエストパラメータで渡すことでeventコレクションの情報を取得できるのです。

しかし、WAOにおいて

''''
登録画面(index.html) ➡ 完了画面(complete.html)
''''

と遷移した場合、登録画面のformタグで以下のように書くことはできません。

action="schedule/newEvent/complete.html?event.id=14179351307431885"

何故なら登録時点ではまだeventコレクションのidが払い出されていないからです。

そのため、間に１画面追加し、以下のような遷移とします。

''''
登録画面(index.html) ➡ リダイレクトするだけの画面（create.html）➡ 完了画面(complete.html)
''''

create.htmlでは、以下のようにリダイレクトを行うだけです。

```
<html>
  <meta http-equiv="refresh" content="0; URL=./complete.html?event.id=">
</html>
```

ここはURL=./complete.html?event.id="があるだけですね。

登録時に、WAOがこの_event.id=_の部分を自動的に_event.id=14179351307431885＿のように置換します。


これでリダイレクト画面create.htmlができました。

あとは完了画面complete.htmlを作成するだけです。

先ほどのリクエストパラメータを受け取って、イベント名、メモ、候補日程を表示します。

```
<tbody>
  <tr>
    <th width="20%">イベント名</th>
    <td data-wao-bind="event.name">イベント名</td>
  </tr>
  <tr>
    <th>メモ</th>
    <td data-wao-bind="event.memo">メモ</td>
  </tr>
  <tr>
    <th>候補日程</th>
    <td data-wao-bind="event.schedule">候補日程</td>
  </tr>
</tbody>
```

こんな感じで、tdタグに、

data-wao-bind="event.name"

を追加しています。

__data-wao-bind__がWAOがDBから取得したデータをバインドするときに使うおまじないです。

event.nameは先ほど言ったように__[コレクション名].[フィールド名]__ですね^^

はい、これでイベントの登録機能は完了です。


### 出欠入力画面

あとは、登録したイベントに対し、各ユーザーが出欠を入力できるような画面を作成しておしまいです。

画面イメージはこんな感じ。

![出欠入力ページの画像](./img/event03.png)

ここも、先ほどと同じように__data-wao-bind__を使うと表示できます。

ですが、

この画面のさっきとの違いは、繰り返し項目がある点です。

こんなときはどうすれば良いでしょう？

__data-wao-iterator__という属性を使います。

__data-wao-iterator="schedule"__とすることでscheduleテーブルの情報を繰り返し表示しますよ〜。

という意味になります。

```
<tr data-wao-iterator="schedule">
  <th style="background: #f5f5f5;" data-wao-bind="schedule.name">
    中村
  </th>
  <td data-wao-bind="schedule.date1">
    ×
  </td>
  <td data-wao-bind="schedule.date2">
    △
  </td>
  <td data-wao-bind="schedule.date3">
    ○
  </td>
  <td data-wao-bind="schedule.comment">
    たくさん飲みます
  </td>
</tr>
```

こんな感じ。

これですべて完成です！

完成版のソースは以下からダウンロードできるので参考にしてください^^

[スケジュール調整アプリサンプルhtml完成版](http://google.com "サンプル完成版")


## ３.統合開発環境AQUAにhtmlをアップロード

まずは以下のURLからAQUAに入ります。

[AQUA](http://google.com "AQUA")

![出欠入力ページの画像](./img/aqua01.png)

左メニューのWEBアプリをクリックします。

![出欠入力ページの画像](./img/aqua02.png)

__WEBアプリを新規作成__のボタンを押します。

![出欠入力ページの画像](./img/aqua03.png)

各項目を入力します。なんでもOKです。

![出欠入力ページの画像](./img/aqua04.png)

こんな感じです。

![出欠入力ページの画像](./img/aqua05.png)

右の方にある開くボタンをクリックしWEBアプリの詳細ページへ遷移します。

![出欠入力ページの画像](./img/aqua06.png)

「このWEBアプリケーションを操作する」のHTMLボタンをクリックします。

![出欠入力ページの画像](./img/aqua07.png)

アップロードボタンをクリックします。

![出欠入力ページの画像](./img/aqua08.png)

先ほど作成したhtmlをzipにし、ドラッグします。

__注意点__

zipファイルは最上位の階層を含まずにzipに固めてください。
例）以下の構造の場合、myappをzipに含めず、それ以下のファイル/ディレクトリを一つのzipとしてまとめる。
  myapp
   |─ bootstrap
   |─ index.html
   └─ schedule

また、アップロード後画面上に反映されない場合は、ブラウザを更新してみてください。

![出欠入力ページの画像](./img/aqua09.png)

左メニューのWEBアプリをクリックする。

![出欠入力ページの画像](./img/aqua10.png)

起動するをクリックする。

これで完了です！


## ４.アプリ起動！

ブラウザから以下を実行してみてください。

http://localhost:8765

先ほど作った画面が表示されていれば成功です！
