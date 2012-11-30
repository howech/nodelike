var connect = require('connect');
var server = connect.createServer();

server.use(connect.static(__dirname));
server.use(require('browserify')(__dirname + '/js/webgame.js'));

server.listen(9797);