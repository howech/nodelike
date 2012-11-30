var intervals = require('./intervals');
var xforms = require('./xforms');
var raycast = require('./raycast');
var _ = require('underscore');
var colors = require('./colors');
var win = require('./window.js');

var View = exports.View = function(width, height, viewWin, textWin) {
    this.width = width || 30;
    this.height = height || 30;
    this.viewWin = viewWin;
    this.textWin = textWin;

    this.c_col = Math.floor(this.width / 2);
    this.c_row = Math.floor(this.height / 2);

    this.screen = [];
    for(var j = 0; j<this.height; ++j) {
	this.screen[j] = [];
    }
}

exports.View.prototype = {
    each: function(func, context) {
	context = context || this;
	for(var j=0; j<this.height; ++j) {
	    for(var i=0; i< this.width; ++i) {
		if( this.screen[j][i] )
		    func.call( context, this.screen[j][i] );
	    }
	}
    },
    draw: function() {
	this.viewWin.erase();
	var rc = this.c_row;
	var cc = this.c_col;
	this.each( function(unit) {
	    this.viewWin.set(unit.y+rc+1,unit.x+cc+1,unit.display,unit.colorIndex );
	});
	if( this.lookMode ) {
	    this.viewWin.setStyle( this.viewY+rc+1,this.viewX+cc+1, 1);
	}
	this.updateLook();
    },
    clear:  function() {
	for(var j=0; j<this.height; ++j) {
	    for(var i=0; i< this.width; ++i) {
		if( this.screen[j][i] )
		    this.screen[j][i] = null;
	    }
	}
    },
    set: function(x,y,display,color,cell,tform) {

	if( color[0] < 0.05 && color[1] < 0.05 && color[2] < 0.05 )
	    return;
	if(!display)
	    return;

	colorIndex = colors.closestColorIndex(color);

	var row = y+this.c_row;
	var col = x+this.c_col;

	this.screen[row][col] = { 
	    x: x,
	    y: y,
	    display: display,
	    colorIndex: colorIndex,
	    cell: cell,
	    tform: tform,
	    color: color,
	    colorw: 1
	}
    },
    inView: function(x,y) {
	var row = y+this.c_row;
	var col = x+this.c_col;
	
	return row>=0 && col>=0 && col< this.width && row < this.height
    },
    getSquare: function(x,y) {
	return this.screen[y+this.c_row][x+this.c_col];
    },
    getCell: function(x,y) {
	var square = this.getSquare(x,y);
	if( square )
	    return square.cell;
	else
	    return null;
    },
    getDescription: function(x,y) {
	var square = this.getSquare(x,y);
	if( square ) {
	    return square.cell.getDescription( square.tform );
	}
	else
	    return "";
    },
    enterLookMode: function(input) {
	this.viewX = 0;
	this.viewY = 0;
	this.lookMode = true;
    },
    exitLookMode: function() {
	this.lookMode = false;
    },
    updateLook: function() {
	if( this.lookMode ) {
	    this.textWin.erase();
	    this.textWin.typeAt( 1, 1, this.getDescription( this.viewX, this.viewY ) );
	}
    },
    moveView: function(dx,dy) {
	if( this.inView( this.viewX + dx, this.viewY + dy ) ) {
	    this.viewX += dx;
	    this.viewY += dy;
	}
    },
    move_n: function() {
	this.moveView(0,-1);
    },
    move_s: function() {
	this.moveView(0,1);
    },
    move_e: function() {
	this.moveView(1,0);
    },
    move_w: function() {
	this.moveView(-1,0);
    },
    move_ne: function() {
	this.moveView(1,-1);
    },
    move_nw: function() {
	this.moveView(-1,-1);
    },
    move_se: function() {
	this.moveView(1,1);
    },
    move_sw: function() {
	this.moveView(-1,1);
    }
}

var vision = exports.vision = function (actor, view) {
    var queue = [];

    var initial_interval = [-Math.PI, Math.PI ];    
    var d = _.clone( actor.position );
    var map = actor.map;

    map.clearVisible();
    view.clear();

    var firstJob = { map:map, 
		     i:initial_interval, 
		     x:[0,0], 
		     t: actor.tform, 
		     d: d, 
		     c: 1,
		     fl: true
		   };

    queue.push( firstJob ); 
 
    while(queue.length > 0 ) {
	var job = queue.shift();
	var X = xforms.transform(job.x, job.t, job.d );
	var cell = job.map.getCell( X );

	if( !cell )
	    continue;
	    
	var N = job.x[0];
	var M = job.x[1];	    
	
	if(!view.inView( N,M ))
	    continue;
	
	if( N * N + M * M > (actor.range || 100) )
	    continue;
	
	var processedRays;
	    
	var visible = false;

	if( cell.blocking ) {
	    visible = job.fl;
	} else {
	    visible = cell.light;
	}

	if(visible)
	    cell.setVisible();
	processedRays = cell.processRays(job);
	
	var color  = processedRays.color; // || [.8,.8,.8];
    	
	view.set( N,M, processedRays.display, color, cell, processedRays.t );
	
	_.each( processedRays.ivs,  function( iv_plus ) {
	    var exits = raycast.exitIntervals( N, M );
	    _.each( exits,  function(exit) {
		var newIv = intervals.intersection( iv_plus.i, exit.i );
		if(newIv.length > 0) {
		    var newJob = _.defaults( 
			{i: newIv, fl: cell.light },
			exit,
			iv_plus,
			job
		    );
		    queue.push( newJob );
		}
	    });
	});
    }
}


var light = exports.light = function (light_source, map) {
    var queue = [];

    var initial_interval = [-Math.PI, Math.PI ];
    
    if( light_source.interval ) {
	initial_interval = intervals.intersection( initial_interval, light_source.interval );
    }
    
    var d = [ light_source.position[0], light_source.position[1] ];
    
    var firstJob = { map: map,
		     i: initial_interval,
		     x: [0,0], 
		     t: light_source.tform, 
		     d: d, 
		     c: light_source.color
		   };

    queue.push( firstJob );
    
    while(queue.length > 0 ) {
	var job = queue.shift();
	var X = xforms.transform(job.x, job.t, job.d );
	var cell = job.map.getCell( X );

	if(!cell)
	    continue;

	var iv = job.i;
	
	var N = job.x[0];
	var M = job.x[1];
	
	// check vision radius
	if( (N * N + M * M) > light_source.range )
	    continue;
	
	var processedRays;
	    
	processedRays = cell.processLightRays(job);
	    
	_.each( processedRays.ivs, function( iv_plus ) {
	    var exits = raycast.exitIntervals( N, M );
	    _.each( exits, function(exit) {
		var newIv = intervals.intersection( iv_plus.i, exit.i );
		if(newIv.length > 0) {
		    var newJob = _.defaults(
			{ i:newIv},
			exit,
			iv_plus,
			job
		    );
		    queue.push( newJob );
		}
	    });
	});
    }
}
