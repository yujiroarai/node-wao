// 使用するモジュールの定義
var http = require('http'),
  conf = require('config'),
  url = require('url'),
  path = require('path'),
  querystring = require('querystring'),
  fs = require('fs'),
  mime = require('mime'),
  jsdom = require("jsdom"),
  $ = require("jquery")(jsdom.jsdom().createWindow()),
  mongo = require('mongodb');

// jQueryの拡張
(function($) {
  // 自分自身のhtmlソースを返却する
  $.fn.selfHtml = function(options){
    if($(this).get(0)){
      return $(this).get(0).outerHTML;
    }
  }
})($);

var WaoAppFactory = function() {
  var appname,
    appdir,
    dbname,
    port;
  return {
    createHttpServer : function(appname, port) {
      this.appname = appname;
      this.port = port;
      this.dbname = appname + '_' + port;
      this.appdir = appname + '_' + port;
      var myWaoApp = this;
      var s = http.createServer(function(request, response) {
        console.log('Start http process.');
        console.log('  URL="' + request.url + '", method="' + request.method + '"');
        console.log('');
        var waoPage = WaoPageFactory();

        waoPage.init(myWaoApp.dbname, request.url, function(err, data) {
          // methodで処理を切り分け
          // PUTメソッド・・・データの変更
          // DELETEメソッド・・・データの削除
          // POSTメソッド・・・データの追加
          waoPage.postData(request, function(err, data) {
            if (err) throw err;
            // GETメソッド・・・データの取得
            waoPage.getData(request, function(err, data) {
              if (err) throw err;
              // テンプレートを読み込む
              waoPage.readTemplate(myWaoApp.appdir, request, function(err, data) {
                if (err) throw err;
                // レスポンス出力
                var status = waoPage.getStatusCode();
                var mimeType = waoPage.getMimeType();
                if (status == 200) {
                  console.log('Start response. statusCode=' + status + ', mimeType="' + mimeType + '"');
                  if (mimeType == 'image/png') {
                    console.log();
                    var path = waoPage.getLocalFilePath();
                    var stat = fs.statSync(path);
                    response.writeHead(200, {
                      'Content-Type' : mimeType,
                      'Content-Length': stat.size
                    });
                    fs.createReadStream(path).pipe(response);
                  } else {
                    response.writeHead(status, { 'Content-Type': mimeType });
                    response.end(waoPage.getResponseData());
                  }
                } else if (status == 301) {
                  var redirectUrl = 'http://localhost:' + myWaoApp.port + waoPage.getRedirectUrl(); // TODO：ホスト名とか
                  console.log('Start response. statusCode=' + status + ', Location="' + redirectUrl + '"');
                  response.writeHead(status, { 'Location': redirectUrl });
                  response.end();
                } else {
                  console.log('Start response. statusCode=' + status);
                  response.statusCode = (status);
                  response.end();
                }
                console.log('------------------------------');
                console.log('');
              });
            });
          });
        });
      });
      s.listen(port);
      listenPorts.push(port);
      return s;
    }
  };
}

var listenPorts = [];
var waoApp = WaoAppFactory();
waoApp.createHttpServer(conf.waoApp.appName, conf.waoApp.port);

var WaoPageFactory = function() {
  var responseData,
    mimeType,
    redirectUrl,
    statusCode,
    localFilePath,
    db,
    crudData;
  return {
    init : function(dbname, request_url, callback) {
      var url_parts = url.parse(request_url, true);
      this.crudData = { find : {}, insert: {} };
      this.findData = {};
      var that = this;

      // データベースへの接続
      var dbconnect = function() {

        // TODO：何でもかんでもつなぎにいっちゃうバカなやつ
        var mongoServer = new mongo.Server('localhost', mongo.Connection.DEFAULT_PORT, {});
        that.db = new mongo.Db(dbname, mongoServer, {});
        that.db.open(function(err, db) {
          console.log('Success to open db connection. dbname=' + dbname);
          callback(null, null);
        });
      };
      if (url_parts.query.hasOwnProperty('_FILE.path')) {
        // ディレクトリの情報を取得
        WaoPageFactory().readDirRecursive('./templates/' + url_parts.query['_FILE.path'], function(fileList) {
          that.findData._FILE = fileList;
          dbconnect();
        });
      } else {
        dbconnect();
      }
    },
    // POSTメソッドの処理（データの追加）
    // TODO：リファラからテンプレートを選択してフォームの整合性をチェックする処理を追加する
    // ・余計なフォームが送信されて来ていないか？
    // ・html5 form validationと同じ内容のサーバー側バリデーション処理
    postData : function(request, callback) {
      if (request.method == 'POST') {
        var me = this;
        var data = '';
        request.on('data', function(chunk) {
          data += chunk;
        });
        request.on('end', function() {

          var collectionName;
          // POSTデータをJSON化
          var query = querystring.parse(data);
          // JSON化したPOSTデータをmongoDBに入れられるJSON形式に変換
          for (var key in query) {
            // <input name="collactionName.propertyName">
            collectionName = key.match(/^([^.]+)\./)[1]; // TODO：collectionの決定方法がアホ
            if (collectionName == '_APP') {
              // アプリ起動オプション
              switch (query[key]){
                case 'start()':
                  var appProp = key.replace(collectionName + '.', '').split(':');
                  if (appProp[0] != 'undefined' && appProp[1] != 'undefined') {
                    if ($.inArray(appProp[1], listenPorts) < 0) {
                      var waoApp = WaoAppFactory();
                      waoApp.createHttpServer(appProp[0], appProp[1]);
                    }
                  }
                  break;
                default :
                  break;
              }
            } else {
              if (!me.crudData.insert[collectionName]) {
                var createdDate = new Date().getTime();
                me.crudData.insert[collectionName] = {
                  id: (createdDate + Math.random() + '').replace('.', ''),
                  _createdDate: createdDate
                }
              }
              me.crudData.insert[collectionName][key.replace(collectionName + '.', '')] = query[key];
            }
          }
          // mongoDBにデータを登録
          var colCount = 0;
          var maxColCount = Object.keys(me.crudData.insert).length;
          if (maxColCount == 0) {
            callback(null, null);
          } else {
            for (var colName in me.crudData.insert) {
              me.db.collection(colName, function(err, collection) {
                collection.insert(me.crudData.insert[colName], {w:1}, function() {
                  console.log('WaoPage.postData() : Success to insert a new data.');
                  console.log(me.crudData.insert[colName]);
                  console.log('');
                  colCount++;
                  if (colCount == maxColCount) {
                    callback(null, null);
                  }
                });
              });
            }
          }
        });
      } else {
        callback(null, null);
      }
    },
    // GETメソッドあるいはクエリストリングの処理（データの取得）
    // TODO：postData()ともう少し共通化できると思う
    getData : function(request, callback) {
      // GETメソッドじゃなくてもクエリストリングの解析処理を行う
      var me = this;
      var url_parts = url.parse(request.url, true);
      var collectionName;
      // GETパラメタ
      var query = url_parts.query;
      // GETパラメタをmongoDBの検索条件に指定できるJSON形式に変換
      for (var key in query) {
        if (key.match(/^([^.]+)\./)) {
          // ?collactionName.propertyName=xxxx
          collectionName = key.match(/^([^.]+)\./)[1]; // TODO：collectionの決定方法がアホ
          if (!me.crudData.find[collectionName]) me.crudData.find[collectionName] = {};
          me.crudData.find[collectionName][key.replace(collectionName + '.', '')] = query[key];
        } else {
          // ?collactionName=all
          // 検索条件なし
          collectionName = key;
          if (!me.crudData.find[collectionName]) me.crudData.find[collectionName] = {};
        }
      }
      // mongoDBからデータを取得
      var colCount = 0;
      var maxColCount = Object.keys(me.crudData.find).length;
      if (maxColCount == 0) {
        callback(null, null);
      } else {
        for (var colName in me.crudData.find) {
          if (colName == '_FILE') {
            colCount++;
            if (colCount == maxColCount) {
              callback(null, null);
            }
          } else {
            me.db.collection(colName, function(err, collection) {
              var findColName = colName;
              collection.find(me.crudData.find[colName]).toArray(function(err, docs) {
                console.log('WaoPage.getData() : Success to find data[s].');
                console.log('  findColName = "' + findColName + '"');
                console.log(me.crudData.find[colName]);
                console.log('  count=' + docs.length);
                me.findData[findColName] = [];
                for (var i = 0; i < docs.length; i++) {
                  console.log(docs[i]);
                  me.findData[findColName][i] = docs[i];
                }
                console.log('');
                colCount++;
                if (colCount == maxColCount) {
                  callback(null, null);
                }
              });
            });
          }
        }
      }
    },
    // URLルーティングの処理
    // TODO：expressに置き換えるか検証・検討
    // → expressだとURLパターンごとに関数を用意しなければならない？
    getFilePathByURL : function(urlpath) {
      var urlElements = url.parse(urlpath, true);
      var filepath = urlElements.pathname;
      // URLが"/"で終わる場合はindex.htmlを開く
      if (filepath.match(/\/$/)) {
        filepath += 'index.html';
      }
      return filepath;
    },
    // テンプレートを選択する処理
    readTemplate : function(appdir, request, callback) {
      var me = this;
      var filepath = this.getFilePathByURL(request.url);
      me.db.close();
      console.log('Success to close db connection.');
      console.log();
      var path = conf.basepath + '/' + appdir + filepath;
      me.mimeType = mime.lookup(filepath);
      if (me.mimeType == 'image/png') {
        me.statusCode = 200;
        me.responseData = null;
        me.localFilePath = path;
        callback(null, null);
      } else {
        fs.readFile(conf.basepath + '/' + appdir + filepath, 'utf8', function(err, data){
          if (err) {
            console.log('WaoPage.readTemplate() : Faild to load this template.');
            console.log('  filepath = ' + filepath);
            console.log('');
            me.statusCode = 404;
          } else {
            console.log('WaoPage.readTemplate() : Success to load this template.');
            console.log('  filepath = ' + filepath);
            console.log('');
            me.statusCode = 200;
            me.responseData = data;
            me.localFilePath = null;
            if (me.mimeType == "text/html") {
              // <meta http-equiv="refresh">の指定があればサーバー側で301リダイレクトする
              var $dom = $(data); // TODO：<!DOCTYPE>に対応できてない ＆ parseできない時の処理が必要
              var $redirect = $dom.find('meta[http-equiv=refresh]');
              if ($redirect) {
                var contextMatch = ($redirect.attr('content') + "").match(/^[0-9]+;[ ]+URL=(.*)$/);
                if (contextMatch) {
                  // TODO：URLの組み立てがすげー中途半端
                  var basepath = request.url.match(/^(.*\/)[^\/]+\.html$/)[1];
                  var target = contextMatch[1].replace('./',''); // TODO：これがヤバい
                  me.statusCode = 301;
                  me.redirectUrl = basepath + me.bindGetParam(target, 0, false);
                } else {
                  me.bind();
                }
              }
            }
          }
          callback(null, null);
        });
      }
    },
    // データバインド処理
    bind : function() {
      var $dom = $(this.responseData); // TODO：<!DOCTYPE>に対応できてない ＆ parseできない時の処理が必要
      var me = this;
      // GETパラメタにバインド
      $dom.find('a').each(function(){
        if ($(this).attr('href') != null) {
          $(this).attr('href', me.bindGetParam($(this).attr('href'), 0, false));
        }
      });
      $dom.find('form').each(function(){
        if ($(this).attr('action') != null) {
          $(this).attr('action', me.bindGetParam($(this).attr('action'), 0, false));
        }
      });
      // data-wao-bind属性にバインド（innerHtml）
      $dom.find('[data-wao-bind]').each(function(){
        var val = $(this).attr('data-wao-bind');
        var col = val.split('.')[0];
        var prop = val.split('.')[1];
        // data-wao-iteratorに指定されている場合、除外する
        if ($(this).closest('[data-wao-iterator="'+ col + '"]').length == 0) {
          // TODO:属性に対応
          $(this).html(me.getValue(col, prop, 0));
          $(this).removeAttr('data-wao-bind');
        }
      });

      // 属性のバインド（data-wao-bind-foobar="col.prop"）
      var bindAttrList = $dom.html().match(/data-wao-bind-[^=]+/g); // まずは属性を抜き出す
      if (bindAttrList != null) {
        bindAttrList = bindAttrList.filter(function (x, i, self) { // 重複データは削除
          return self.indexOf(x) === i;
        });
        for (var idx in bindAttrList) {
          var bindAttr = bindAttrList[idx];
          console.log('bind() : attribute_name=' + bindAttr);
          $dom.find('[' + bindAttr + ']').each(function(){
            var val = $(this).attr(bindAttr);
            var col = val.split('.')[0];
            var prop = val.split('.')[1];
            // data-wao-iteratorに指定されている場合、除外する
            if ($(this).closest('[data-wao-iterator="'+ col + '"]').length == 0) {
              $(this).attr(bindAttr.replace('data-wao-bind-',''), me.getValue(col, prop, 0));
              $(this).removeAttr(bindAttr);
            }
          });
        }
      }

      // data-wao-iterator配下のbind処理
      $dom.find('[data-wao-iterator]').each(function(){
        var col = $(this).attr('data-wao-iterator');
        var iteratorTag = $(this).clone();
        var appendedTag = $(this);
        for (var i = 0; i < me.findData[col].length; i++) {
          // GETパラメタにバインド
          appendedTag.find('a').each(function(){
            if ($(this).attr('href') != null) {
              $(this).attr('href', me.bindGetParam($(this).attr('href'), i, true));
            }
          });
          appendedTag.find('form').each(function(){
            if ($(this).attr('action') != null) {
              $(this).attr('action', me.bindGetParam($(this).attr('action'), i, true));
            }
          });
          // data-wao-bind属性にバインド（innerHtml）
          appendedTag.find('[data-wao-bind]').each(function(){
            var val = $(this).attr('data-wao-bind');
            var col = val.split('.')[0];
            var prop = val.split('.')[1];
            // TODO:属性に対応
            $(this).html(me.getValue(col, prop, i));
            $(this).removeAttr('data-wao-bind');
          });
          if (i + 1 < me.findData[col].length) {
            appendedTag = iteratorTag.clone().appendTo($(this).parent());
          }
        }
        $(this).removeAttr('data-wao-iterator');
      });
      // TODO:each(function(){})を使ってるから同期が必要じゃ？？？
      this.responseData = $dom.selfHtml();
    },
    // URLに指定されたGETパラメタにデータをバインドする処理
    bindGetParam : function(target, index, isIterator) {
      // ?hoge=hoge&hoge=hoge....部分を抜き出す
      var getparam = target.match(/\?([^=]+=([^&]*)?&?)*/);
      var getparamR = '';
      if (getparam) { // URLにGETパラメタが含まれていれば
        getparamR = '?';
        getparam = getparam[0].replace(/^\?/,'').split('&'); // hoge=hogeに分割して配列化
        for (var i in getparam) {
          var paramName = getparam[i].split('=')[0];
          var paramValue = getparam[i].split('=')[1];
          // 既にbindされている場合は、対象外とする
          if (paramValue.trim() == '') {
            var trg = {
              collectionName: paramName.split('.')[0],
              propertyName: paramName.split('.')[1]
            };
            // data-wao-iteratorに指定されている場合、除外する
            var val = '';
            if (!isIterator) {
              if (this.findData[trg.collectionName] && this.findData[trg.collectionName].length == 1) {
                val = this.getValue(trg.collectionName, trg.propertyName, index);
              }
            } else {
              val = this.getValue(trg.collectionName, trg.propertyName, index);
            }
            getparamR += paramName + '=' + val + '&';
          } else {
            getparamR += paramName + '=' + paramValue + '&';
          }
        }
        getparamR = getparamR.slice(0, -1);
      }
      return target.replace(/\?([^=]+=([^&]*)?&?)*/, '') + getparamR;
    },
    // 参照文字列から自動的に適切なオブジェクトを選択して、参照文字列に対応するデータを返却する
    getValue : function(col, prop, index) {
      // TODO：_DBとか_SESって修飾子がついていたら・・・的な処理が今後必要
      var val = '（データが見つかりません）';
      var key = 'undefined';
      if (col == '_FILE') {
          key = '_FILE';
          val = JSON.stringify(this.findData[col]);
      } else {
        if (this.findData[col] && this.findData[col][index] && this.findData[col][index][prop]) {
          key = '_DB.' + col + '.' + prop;
          val = this.findData[col][index][prop];
        } else if (this.crudData.insert[col] && this.crudData.insert[col][prop]) {
          key = '_DB.' + col + '.' + prop;
          val = this.crudData.insert[col][prop];
        }
      }
      console.log('getValue() : ' + key + '=' + val);
      return val;
    },
    // レスポンス出力処理
    getResponseData : function() {
      // TODO DOCTYPEが無いとCSSが崩れることがあるので・・・ここも暫定対策
      var doctype = (this.getMimeType() == 'text/html') ? '<!DOCTYPE html>\n' : '';
      return doctype + this.responseData;
    },
    // HTTPステータスコードを返却する
    getStatusCode : function() {
      return this.statusCode;
    },
    // MIMEタイプを返却する
    getMimeType : function() {
      return this.mimeType;
    },
    // リダイレクト先URLを返却する
    getRedirectUrl : function() {
      return this.redirectUrl;
    },
    // リソースのローカル上のパスを返却する
    getLocalFilePath : function() {
      return this.localFilePath;
    },
    // ディレクトリを再帰的に読み込んで配列で返す
    readDirRecursive : function(dir, callback) {
      var walk = function(p, callback) {
        var results = [];
        fs.readdir(p, function (err, files) {
          if (err) callback(err, []);

          var pending = files.length;
          if (!pending) return callback(null, results);

          files.map(function (file) {
            return path.join(p, file);
          })
          .filter(function (file) {
            if(fs.statSync(file).isDirectory()) {
              walk(file, function(err, res) {
                var stat = fs.statSync(file);
                results.push({
                  name: path.basename(file),
                  files:res,
                  type: 'directory',
                  time: stat.mtime
                });
                if (!--pending) {
                  callback(null, results);
                }
              });
            }
            return fs.statSync(file).isFile();
          })
          .forEach(function (file) {
            var stat = fs.statSync(file);
            results.push({
              name: path.basename(file),
              type: 'file',
              time: stat.mtime,
              mime: mime.lookup(path.basename(file))
            });
            if (!--pending) callback(null, results);
          });
        });
      };

      walk(dir, function(err, results) {
        if (err) console.log('err: ' + err);
        callback({ file_list: results });
      });
    }
  };
};
