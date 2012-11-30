var term;

var win = require('./window');
var game = require('./game');


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
    game.start(this);
    term.charMode = true;
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
