var http = require('http'),
  fs = require('fs'),
  jsdom = require("jsdom"),
  $ = require("jquery")(jsdom.jsdom().createWindow());

var shop_item = { "shop.name" : "tanio", "shop.id" : 'AA' };

http.createServer(function (request, response) {

  fs.readFile(__dirname + '/bind_out.html', function (err, data) {
    if (err) throw err;

    var body = $(data.toString());

    body.find('[data-bind-out]').each(function(){
      var bind_out = JSON.parse($(this).attr('data-bind-out'));
      $(this).html(shop_item[bind_out.ARG]);
      console.log(bind_out.RESULT);
    });

    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(body.html());

  });

}).listen(process.env.PORT || 8080);
