var nc = require('ncurses');
var win = new nc.Window();

win.on('inputChar', function(a,b,c) { console.log( [a,b,c].join(" ") ) } );
