var http = require('http'),
  fs = require('fs'),
  jsdom = require("jsdom"),
  mongoose = require('mongoose'),
  $ = require("jquery")(jsdom.jsdom().createWindow()),
  mongo = require('mongodb');

// mongoose
var Schema   = mongoose.Schema;
var ShopSchema = new Schema({
  name:  String,
  address: String
});
mongoose.model('Shop', ShopSchema);
mongoose.connect('mongodb://localhost/wao');

// mongodb
// var db = new mongo.Db('wao', new mongo.Server('localhost',mongo.Connection.DEFAULT_PORT, {}), {});

http.createServer(function (request, response) {

  fs.readFile(__dirname + '/bind_out.html', function (err, data) {
    if (err) throw err;

    var body = $(data.toString());
    var wao_script = body.find('script[type="text/wao"]');
console.log('00000000000000000000');
eval(wao_script.html());
console.log('00000000000000000000');
    // body.find('[data-bind-out]').each(function(){
    //   var bind_out = JSON.parse($(this).attr('data-bind-out'));
    // });

    var body = data.toString();
    var title = $(body).html();
    console.log(title);

    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(title);

  });

}).listen(process.env.PORT || 8080);
