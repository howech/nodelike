
var intervals = require('./intervals');
var xforms = require('./xforms');
var raycast = require('./raycast');
var nc = require('ncurses');
var _ = require('underscore');

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

    map.clearVisible();

    queue.push( {i: initial_interval, x:[0,0], t:0, d: d, c:[1,1,1] } );
    
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
	    window.addstr(M+1+15,N+1+15,processedRays.display,1);
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
}
