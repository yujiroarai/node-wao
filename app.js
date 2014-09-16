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
  // URLからテンプレートを決定
  var filepath = waoPage.getFilePathByURL(request);
  // テンプレートを読み込む
  waoPage.readTemplate(filepath, function(err, data) {
    if (err) throw err;
    // レスポンス出力
    var status = waoPage.getStatusCode();
    var mimeType = waoPage.getMimeType();
    console.log('Start response. statusCode = ' + status + ', mimeType = ' + mimeType);
    if (status == 200) {
      response.writeHead(status, { 'Content-Type': mimeType });
      response.end(waoPage.getResponseData());
    } else {
      response.statusCode = (status);
      response.end();
    }
  });
}).listen(process.env.PORT || 8888);

var WaoPageFactory = function() {
  var responseData,
    mimeType,
    statusCode;
  return {
    // URLルーティングの処理
    // TODO：expressに置き換えるか検証・検討
    getFilePathByURL : function(request) {
      var urlElements = url.parse(request.url, true);
      var filepath = urlElements.pathname;
      // URLが"/"で終わる場合はindex.htmlを開く
      if (filepath.match(/\/$/)) {
        filepath += 'index.html';
      }
      return filepath;
    },
    // テンプレートを選択する処理
    readTemplate : function(filepath, callback) {
      var me = this;
      fs.readFile(conf.basepath + filepath, 'utf8', function(err, data){
        if (err) {
          console.log('WaoPage.readTemplate() : Faild to load this template. filepath = ' + filepath);
          me.statusCode = 404;
        } else {
          console.log('WaoPage.readTemplate() : Success to load this template. filepath = ' + filepath);
          me.statusCode = 200;
          me.mimeType = mime.lookup(filepath);
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
  };
};