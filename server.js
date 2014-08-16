var http = require('http'), fs = require('fs');

http.createServer(function (request, response) {

  fs.readFile('./hello.html', 'UTF-8', function(err, data) {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(data);
  });

}).listen(process.env.PORT || 8080);
