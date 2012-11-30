var connect = require('connect');
var server = connect.createServer();

server.use(connect.static(__dirname));
server.use(require('browserify')(__dirname + '/js/webgame.js'));

var port = process.env.PORT || 5000;
server.listen(port);