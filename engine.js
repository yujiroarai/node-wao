var http = require('http'),
  fs = require('fs'),
  jsdom = require("jsdom"),
  $ = require("jquery")(jsdom.jsdom().createWindow());

http.createServer(function (request, response) {

  fs.readFile(__dirname + '/bind_out.html', function (err, data) {
    if (err) throw err;

    var body = data.toString();
    var bind_out = $(body).find('[data-bind-out]').attr('data-bind-out');
    var bind_out_obj = JSON.parse(bind_out);
    console.log(bind_out_obj.RESULT);

    // bind_out.each(function(){
    //   console.log($(this).attr('data-bind-out'));
    // });


    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(body);

  });

}).listen(process.env.PORT || 8080);
