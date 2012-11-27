var _ = require('underscore');
var map = require('./map');
var cell = require('./cell');
var actor = require('./actor');
var vision = require('./vision');
var input = require('./input');
var vision = require('./vision');
var nc = require('ncurses');
var win = new nc.Window();
var colors = require('./colors');

var displayWin = new nc.Window(32,32,1,1);
displayWin.frame();
displayWin.label("  Actual  ");

colors.setup();

var viewWin = new nc.Window(32,32,1,32);
viewWin.frame();
viewWin.label("  Visible  ");


var quit = function() {
    nc.leave();
    viewWin.close();
    displayWin.close();
    win.close();

    process.exit(0);
}

process.on('uncaughtException', function (err) {
//    quit();

    nc.leave();
    nc.cleanup();
    console.log('Caught exception: ')
    throw err;
    
});

// Build the main map.
var main_map = new map.Map(30,30);

main_map.setCell( 6, 5, new cell.WallCell() );
main_map.setCell( 7, 5, new cell.WallCell() );

main_map.setCell( 9, 5, new cell.MirrorCell('+'));
main_map.setCell(10, 5, new cell.MirrorCell('-'));
main_map.setCell(11, 5, new cell.MirrorCell('-'));
main_map.setCell(12, 5, new cell.MirrorCell('+'));
main_map.setCell(13, 5, new cell.MirrorCell('-'));


main_map.setCell(8,9, new cell.OccludingCell() );

main_map.setCell(12, 6, new cell.MirrorCell('|'));
main_map.setCell(12, 7, new cell.MirrorCell('|'));
main_map.setCell(12, 8, new cell.MirrorCell('|'));
main_map.setCell(12, 9, new cell.MirrorCell('|'));
main_map.setCell(12,10, new cell.MirrorCell('|'));

main_map.setCell( 7, 6, new cell.MirrorCell('|'));
main_map.setCell( 7, 7, new cell.MirrorCell('|'));
main_map.setCell( 7, 8, new cell.MirrorCell('|'));
main_map.setCell( 7, 9, new cell.MirrorCell('|'));
main_map.setCell( 7,10, new cell.MirrorCell('|'));

for(var i=6; i<=10; ++i ) {
    main_map.getCell(12,i).tint = greenish;
    main_map.getCell(7,i).tint =  blueish;
}


main_map.setCell(20, 6, new cell.MirrorCell('-'));
main_map.setCell(17, 7, new cell.MirrorCell('|'));
main_map.setCell(20, 7, new cell.MirrorCell('/'));
main_map.setCell(19, 8, new cell.MirrorCell('/'));
main_map.setCell(21, 6, new cell.MirrorCell('/'));

var greenish = [ .7, 1, .7 ];
var blueish = [.7,.7,1 ];

main_map.setCell(25,25, new cell.GateWayCell('&', 10,3)  );
main_map.setCell(10,3,  new cell.GateWayCell('%', 25,25) );
main_map.getCell(25,25).tint = blueish;
main_map.getCell(10,3).tint =  greenish;


for(var i = 6; i< 26; i+=2)
    for(var j = 13; j< 26; j+=2 )
	main_map.setCell(i,j, new cell.OccludingCell()); 


for(var i = 6; i<26; i += 2) {
    main_map.setCell(i,26, new cell.WallCell());
}

main_map.setCell(15,26, new cell.MirrorCell('-'));
_.extend( main_map.getCell(15,26), 
	  { enchanted: true,
	    tint: [.7,.5,.5]
	  }
	);

//map[29][29] = '@';
var player = new actor.Actor( main_map );

main_map.getCell(29,29).enter(player);
player.position[0] = 29;
player.position[1] = 29;


function drawMap( map, window) {
    window.erase();
    window.frame();
    window.label("  Actual  ");

    map.each( function(cell) {
	var attr = cell.visible ? nc.attrs.REVERSE : nc.attrs.NORMAL;
	
	window.addstr( cell.y+1, cell.x+1, cell.getMapSymbol(0) || "X" , 1 );
	if( cell.visible ) {
	    window.chgat(cell.y+1, cell.x+1, 1, nc.attrs.REVERSE  );
	}

	
    });
}

var counter = 0;
var update = function() {
    main_map.clearVisible();

    vision.vision( player, viewWin );
    drawMap( main_map, displayWin );

    win.addstr(33,0,counter++ + " ");
    win.addstr(34,0,"[" + player.position[0] + "," + player.position[1] + "]" );
    nc.redraw();
}

var inputObj = new input.Input(player, main_map, update, quit);


function doInput(a,b,c) { inputObj.onInput(a,b,c) };

displayWin.on('inputChar', doInput );
viewWin.on('inputChar', doInput );
win.on('inputChar', doInput );

//nc.colorPair(128, nc.colors.WHITE, nc.colors.BLUE );
//nc.colorPair(72, nc.colors.RED, nc.colors.BLACK );

nc.showCursor = false;



update();


