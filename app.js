var http = require('http'),
  fs = require('fs'),
  url = require('url'),
  jsdom = require("jsdom"),
  mongoose = require('mongoose'),
  $ = require("jquery")(jsdom.jsdom().createWindow()),
  conf = require('config'),
  mongo = require('mongodb');

http.createServer(function (request, response) {

  var urlElements = url.parse(request.url, true);
  var filepath = urlElements.pathname;

  if(filepath !== '/favicon.ico') {
    fs.readFile(conf.basepath + filepath, function (err, data) {
      if (err) throw err;
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end(data);
    });
  }

}).listen(process.env.PORT || 8888);
