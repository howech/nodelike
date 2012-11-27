
var intervals = require('./intervals');
var xforms = require('./xforms');
var raycast = require('./raycast');
var nc = require('ncurses');
var _ = require('underscore');
var colors = require('./colors');

var vision = exports.vision = function (actor, window) {
    window.erase();
    window.frame();
    window.label("  Visible  ");
    window.scrollok(false);

    var queue = [];

    var initial_interval = [-Math.PI, Math.PI ];
    
    if( actor.lantern.on ) {
	var lantern_interval = intervals.boundingInterval( actor.lantern.angle + actor.lantern.aperture, actor.lantern.angle - actor.lantern.aperture );
	initial_interval = intervals.intersection( initial_interval, lantern_interval );
    }
    
    var d = [ actor.position[0], actor.position[1] ];
    var n = d[0];
    var m = d[0];
    var map = actor.map;
    
    var colorAggregates = {};

    map.clearVisible();

    queue.push( {i: initial_interval, x:[0,0], t: actor.tform, d: d, c:1  } );
    
    while(queue.length > 0 ) {
	var job = queue.shift();
	var iv = job.i;

	var N = job.x[0];
	var M = job.x[1];

	var tform = job.t;
	var delta = job.d;

	var mapcoords = xforms.transform( job.x, job.t, job.d );

	var x = mapcoords[0];
	var y = mapcoords[1];
	job.m = [x,y];

	//var X = N + n;
	//var Y = M + m;
	//job.v = [X,Y];

	// Check for out of bounds
	if(x<0 || x>=30 || y<0 || y>=30) 
	    continue;

	if( N < -15 || N >= 15 || M < -15 || M >= 15 )
	    continue;

	// check vision radius
	if( N * N + M * M > 400 )
	    continue;

	var cell = map.getCell(x,y);
	var processedRays;

	if( cell ) {
	    cell.setVisible();
	    cell.visible = true;
	    processedRays = cell.processRays(job);
	}

	if( processedRays.display ) {
	    var row = M+15+1;
	    var col = N+15+1;

	    var color = processedRays.color || [.8,.8,.8];
	    var key = row + " " + col;

	    colorAggregates[key] = colors.collectColorValues( color, colorAggregates[key] );
	    colorAggregates[key].row = row;
	    colorAggregates[key].col = col;
	    colorAggregates[key].display = processedRays.display;

	    //colorIndex = Math.floor( Math.random() * 256 );
	    
	}

	processedRays.ivs.forEach( function( iv_plus ) {
	    var exits = raycast.exitIntervals( N, M );
	    exits.forEach( function(exit) {
		var newIv = intervals.intersection( iv_plus.i, exit.i );
		if(newIv.length > 0) {
		    queue.push( _.defaults( { i: newIv } , 
					    exit,    // get the x property
					    iv_plus, // get any transforms, reflections, etc
					    job      // get everything else from the original job
					  ) );
		}
	    });
	});
    }

    _.each(colorAggregates, function( ag ) {
	var colorIndex = colors.averageColorIndex( ag );
	window.addstr(ag.row,ag.col,ag.display,1);
	window.chgat(ag.row,ag.col, 1, nc.attrs.NORMAL, colorIndex );

    });
}
