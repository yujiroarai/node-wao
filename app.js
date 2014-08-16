var http = require('http'), fs = require('fs');
var jsdom = require("jsdom");
var $ = require("jquery")(jsdom.jsdom().createWindow());

http.createServer(function (request, response) {

  fs.readFile(__dirname + '/hello.html', function (err, data) {
    if (err) throw err;

    var body = data.toString();
    var title = $(body).html();
    console.log(title);

    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(title);

  });

}).listen(process.env.PORT || 8080);
