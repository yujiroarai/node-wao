// 使用するモジュールの定義
var http = require('http'),
  conf = require('config'),
  url = require('url'),
  fs = require('fs'),
  mime = require('mime'),
  jsdom = require("jsdom"),
  $ = require("jquery")(jsdom.jsdom().createWindow()),
  mongo = require('mongodb'),
  mongoose = require('mongoose');

http.createServer(function (request, response) {
  var waoPage = WaoPageFactory();
  // テンプレートを読み込む
  waoPage.readTemplate(request, function(err, data) {
    if (err) throw err;
    // レスポンス出力
    var status = waoPage.getStatusCode();
    var mimeType = waoPage.getMimeType();
    console.log('Start response. statusCode = ' + status + ', mimeType = ' + mimeType);
    if (status == 200) {
      response.writeHead(status, { 'Content-Type': mimeType });
      response.end(waoPage.getResponseData());
    } else if (status == 301) {
      var redirectUrl = waoPage.getRedirectUrl();
      response.writeHead(status, { 'Location': 'http://localhost:8888' + redirectUrl });
      response.end();
    } else {
      response.statusCode = (status);
      response.end();
    }
  });
}).listen(process.env.PORT || 8888);

var WaoPageFactory = function() {
  var responseData,
    mimeType,
    redirectUrl,
    statusCode;
  return {
    // URLルーティングの処理
    // TODO：expressに置き換えるか検証・検討
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
    readTemplate : function(request, callback) {
      var me = this;
      var filepath = this.getFilePathByURL(request.url);
      fs.readFile(conf.basepath + filepath, 'utf8', function(err, data){
        if (err) {
          console.log('WaoPage.readTemplate() : Faild to load this template. filepath = ' + filepath);
          me.statusCode = 404;
        } else {
          console.log('WaoPage.readTemplate() : Success to load this template. filepath = ' + filepath);
          me.statusCode = 200;
          me.mimeType = mime.lookup(filepath);
          if (me.mimeType == "text/html") {
            // <meta http-equiv="refresh">の指定があればサーバー側で301リダイレクトする
            var $dom = $(data);
            var $redirect = $dom.find('meta[http-equiv=refresh]');
            if ($redirect) {
              var contextMatch = ($redirect.attr('content')+"").match(/^[0-9]+;[ ]+URL=(.*)$/);
              if (contextMatch) {
                // TODO：URLの組み立てがすげー中途半端
                var basepath = request.url.match(/^(.*\/)[^/]+\.html$/)[1];
                var target = contextMatch[1].replace('./','');
                me.statusCode = 301;
                me.redirectUrl = basepath + target;
              }
            }
          }
          me.responseData = data;
        }
        callback(null, null);
      });
    },
    // レスポンス出力処理
    getResponseData : function() {
      return this.responseData;
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
  };
};