var _ = require('underscore');
var map = require('./map');
var cell = require('./cell');
var actor = require('./actor');
var vision = require('./vision');
var input = require('./input');
var vision = require('./vision');
var colors = require('./colors');
var win = require('./window');

var main_map;
var view;
var inputObj;
var player;
var viewWin;
var displayWin;
var term;

function drawMap( map, window) {
    window.erase();
    //window.label("  Actual  ");

    map.each( function(cell) {
	var colorPair = cell.visible ? 4 * 256 : 7 * 256;
	window.set(cell.y+1, cell.x+1, cell.getMapSymbol(0), colorPair );	
    });
}

var quit = exports.quit = function() {
    viewWin.close();
    displayWin.close();
    win.close();

    process.exit(0);
}


var update = exports.update = function() {
    main_map.clearVisible();
    main_map.clearLight();

    if( player.lantern.on ) {
	vision.light( { interval: player.lantern.interval,
			tform: player.tform,
			position: player.position,
			color: [ 1, 1, 1],
			range: 64
		      },
		      main_map );
    }
    
    vision.light( { interval: [-Math.PI, Math.PI ],
		    tform: player.tform,
		    position: player.position,
		    color: [1,1,1],
		    range: 2
		  },
		  main_map );

    _.each( main_map.getLightSources(), function( source ) {
	vision.light( source, main_map );
    });
        
    vision.vision( player, view );
    view.draw( viewWin );
    drawMap( main_map, displayWin );

    viewWin.refresh();
    displayWin.refresh();

    inputObj = new input.Input(term, player, main_map, view, update, quit);
}

var inputHandler = exports.inputHandler = function() {
    console.log( "event");
    inputObj.onInput();
}

var start = exports.start = function(t) {
    term = t;
    colors.setup( term);
    displayWin = new win.Window(32,32,term);

    displayWin.row = 0;
    displayWin.col = 0;
    displayWin.border = true;
    displayWin.label = "  Actual  ";
    
    viewWin = new win.Window(32,32, term);
    viewWin.row=0;
    viewWin.col=32;
    viewWin.border = true;
    viewWin.label = "  Visible  ";


    // Build the main map.
    main_map = new map.Map(30,30);

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
    
    main_map.setCell(20, 6, new cell.MirrorCell('-'));
    main_map.setCell(17, 7, new cell.MirrorCell('|'));
    main_map.setCell(20, 7, new cell.MirrorCell('/'));
    main_map.setCell(19, 8, new cell.MirrorCell('/'));
    main_map.setCell(21, 6, new cell.MirrorCell('/'));
    
    var greenish = [ .7, 1, .7 ];
    var blueish = [.7,.7,1 ];
    
    main_map.setCell(15,22, new cell.GateWayCell('&', 10,3)  );
    main_map.setCell(10,3,  new cell.GateWayCell('%', 15,22) );
    main_map.getCell(15,22).tint = blueish;
    main_map.getCell(10,3).tint =  blueish;
    
 
    for(var i = 6; i< 26; i+=2)
	for(var j = 13; j< 26; j+=2 ) {
	    var cel=null;
	    if( i==6 || i == 24 || j == 13 || j == 25 ) {
		cel = new cell.CandleCell();
	    } else if ( i < 11 || i > 18 || j < 16 || j > 20 ) {
		cel = new cell.OccludingCell();
	    }
	    
	    if(cel) {
		var color = [ 0.6, i/30, j / 30 ];
		cel.color = color
		main_map.setCell(i,j, cel);
	    } 
	}
    
    main_map.setCell(13,18, new cell.WallCell());
    main_map.setCell(14,18, new cell.MirrorCell('-'));
    main_map.setCell(15,18, new cell.MirrorCell('-'));
    main_map.setCell(16,18, new cell.MirrorCell('-'));
    main_map.setCell(17,18, new cell.WallCell());
    

    var reddish = [.8,.3,.3]
    _.extend( main_map.getCell(14,18), 
	      { enchanted: true,
		tint: reddish,
	      }
	    );
    
    
    _.extend( main_map.getCell(15,18), 
	      { enchanted: true,
		tint: reddish
	      }
	    );
    
    _.extend( main_map.getCell(16,18), 
	      { enchanted: true,
		tint: reddish
	      }
	    );

    player = new actor.Actor( main_map );

    main_map.getCell(29,29).enter(player);
    player.position = [29,29];    

    view = new vision.View(30,30);
    update();
}




