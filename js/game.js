var _ = require('underscore');
var map = require('./map');
var cell = require('./cell');
var actor = require('./actor');
var vision = require('./vision');
var input = require('./input');
var vision = require('./vision');
var colors = require('./colors');
var win = require('./window');
var objects = require('./objects');
var npc = require('./npc');

var main_map;
var view;
var inputObj;
var player;
var viewWin;
var displayWin;
var textWin;
var inputWin;
var term;

var mapColors = {};

function drawMap( map, window) {
    window.erase();
    //window.label("  Actual  ");
    
    mapColors.white = mapColors.white || window.getStyleFromColor("white");
    mapColors.blue = mapColors.blue || window.getStyleFromColor("blue");

    map.each( function(cell) {
	var colorPair = cell.visible ? mapColors.blue : mapColors.white;
	window.set(cell.y+1, cell.x+1, cell.getMapSymbol(0).display, colorPair );	
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

    _.each( main_map.getActiveCreatures(), function(creature) {
	creature.take_turn();
    });

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


    _.each( player.getLightSources(), function( source ) {
	var ls = source.getLightSource();
	ls.position = player.position;
	vision.light( ls, main_map );
    });
        
    vision.vision( player, view );
    view.draw();
    drawMap( main_map, displayWin );

    textWin.refresh();
    displayWin.refresh();
    viewWin.refresh();
}

var inputHandler = exports.inputHandler = function() {
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
    viewWin.col=31;
    viewWin.border = true;
    viewWin.label = "  Visible  ";

    textWin = new win.Window(5,94,term);
    textWin.row=31;
    textWin.col=0;
    textWin.border=true;

    inputWin = new win.Window(32,32,term);
    inputWin.row=0;
    inputWin.col=62;
    inputWin.border = true;

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
    main_map.getCell(15,22).color = [.8,.6,1];
    main_map.getCell(10,3).tint =  blueish;
    main_map.getCell(10,3).color =  [.8,.6,1];
    main_map.getCell(10,3).enter_tform = 5;
    main_map.getCell(10,3).exit_tform =  4;

    var creature = new npc.Creature( main_map.getCell( 20,3) );
    creature.awake = false;
    creature.position = [20,3];

    for(var i = 6; i< 26; i+=2)
	for(var j = 13; j< 26; j+=2 ) {
	    var cel=null;
	    if( i==6 || i == 24 || j == 13 || j == 25 ) {
		var loc = main_map.getCell(i,j);
		var candle = new objects.Candle(loc);
		if( (i + j) % 3 == 0 ) {
		    candle.light_candle();
		} else {
		    candle.blow_out();
		}
	    } else if ( i < 11 || i > 18 || j < 16 || j > 20 ) {
		cel = new cell.OccludingCell();
		var color = [ 0.6, i/30, j / 30 ];
		cel.color = color
	    }
	    
	    if(cel) {
		main_map.setCell(i,j, cel);
	    } 
	}
    
    main_map.setCell(13,18, new cell.WallCell());
    main_map.setCell(14,18, new cell.MirrorCell('-'));
    main_map.setCell(15,18, new cell.MirrorCell('-'));
    main_map.setCell(16,18, new cell.MirrorCell('-'));
    main_map.setCell(17,18, new cell.WallCell());
    main_map.setCell(13,19, new cell.CandleCell());
    main_map.setCell(17,19, new cell.CandleCell());

    for(i=0;i<30;++i) { 
	main_map.setCell(0,i, new cell.WallCell() );
	main_map.setCell(29,i, new cell.WallCell() );
    }
    for(i=1;i<29;++i) { 
	main_map.setCell(i,0, new cell.WallCell() );
	main_map.setCell(i,29, new cell.WallCell() );
    }

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

    player = new actor.Actor( main_map, textWin );
    new objects.Candle( player );
    player.summarizeContents();

    main_map.getCell(28,28).enter(player);
    player.position = [28,28];    

    view = new vision.View(30,30,viewWin,textWin);
    inputObj = new input.Input(term, player, main_map, view, update, quit, inputWin, textWin);

    update();
}




