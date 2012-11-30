var term;

var win = require('./window');
var game = require('./game');

var help = [
	'%+r termlib color sample help: %-r',
	'',
	' * type "colors"    to see the default internal colors.',
	' * type "webcolors" to see the standard VGA and web safe colors.',
	' * type "nscolors"  to see the VGA and netscape colors by name.',
	' * type "help"      to see this page.',
	' * type "exit"      to quit.',
	' '
];

function termOpen() {
    if ((!term) || (term.closed)) {
	term = new Terminal(
	    {
		x: 10,
		y: 10,
		termDiv: 'termDiv',
		bgColor: '#000000',
		initHandler: termInitHandler,
		exitHandler: termExitHandler,
		cols: 120,
		rows: 40,
		rowHeight: 10,
		handler: game.inputHandler
	    }
	);
	term.charMode = true;
	term.lock = false;
	term.open();
	term.focus();
	// dimm UI text
	var mainPane = (document.getElementById)?
	    document.getElementById('mainPane') : document.all.mainPane;
	if (mainPane) mainPane.className = 'lh15 dimmed';
    }
}

function termExitHandler() {
	// reset the UI
	var mainPane = (document.getElementById)?
		document.getElementById('mainPane') : document.all.mainPane;
	if (mainPane) mainPane.className = 'lh15';
}

function termInitHandler() {
    // output a start up screen
    var w = new win.Window( 10, 34, this );
    w.row = 5;
    w.col = 5;
    w.border = true;

    for(var i=0;i<8;++i) 
	for(var j=0;j<32;++j) {
	    var c = j+i*32;
	    w.set(i+1,j+1,c,0);
	}
    w.refresh();

    game.start(this);

    term.charMode = true;

    // and leave with prompt
    //this.prompt();
}


//if (window.addEventListener) { // Mozilla, Netscape, Firefox
//    window.addEventListener('load', WindowLoad, false);
//} else if (window.attachEvent) { // IE
//    window.attachEvent('onload', WindowLoad);
//}

//function WindowLoad(event) {
module.exports.termOpen = termOpen;

setTimeout( termOpen, 100 );
//    termOpen();
//}
