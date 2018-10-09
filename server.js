let express = require('express');
let webmake = require('webmake');

let app = express();

let port=3003;
let hostUrl='http://127.0.0.1';
app.get('/carota-debug.js', function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'no-cache',
  });
  webmake('src/carota.js', { cache: true }, function(err, content) {
    if (err) {
      res.end('document.write(' + JSON.stringify(err.message) + ');');
    } else {
      res.end(content);
    }
  });
});

app.use(express.static(__dirname));

app.listen(port);
console.log('Server run at:'+ hostUrl +':'+port);
