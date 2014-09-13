var http = require('http'),
  fs = require('fs');

function route(pathname) {
  fs.readFile("/Users/yujiroarai/tmp/html-wao" + pathname, function (err, data) {
    console.log(data.toString());
  });
  console.log("About to route a request for " + pathname);
}

exports.route = route;
