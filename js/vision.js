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
	//for(var i=0; i<this.width; ++i) {
	//    this.screen[j][i] = { colorIndex: 0, style: 0, x: i-this.c_col, y: j-this.c_row }
	//}
    }
}
var memoryColor = [.5,.5,.6];

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
    recall: function(memory) {
	for(var j=0, y=-this.c_row; j<this.height; ++j,++y) {
	    for(var i=0, x=-this.c_col; i< this.width; ++i,++x) {
		var display = memory.recall([x,y]);
		if(display) {
		    this.set(x,y,display,memoryColor,null,0,0);
		}
	    }
	}
    },
    draw: function() {
	this.viewWin.erase();
	var rc = this.c_row;
	var cc = this.c_col;

	if( this.targetMode ) {
	    this.updateTarget();
	}

	this.each( function(unit) {

	    if( _.isUndefined( unit.colorIndex) )
		unit.colorIndex = colors.closestColorIndex(unit.color);


	    this.viewWin.set(unit.y+rc+1,unit.x+cc+1,unit.display,unit.colorIndex + unit.style );
	});
	if( this.lookMode ) {
	    this.viewWin.setStyle( this.viewY+rc+1,this.viewX+cc+1, 1);
	    this.updateLook();
	}
    },
    updateTarget: function() {
	var self = this;
	var blockedColor = colors.closestColorIndex( [.8,0,0] );
	var white = colors.closestColorIndex([.8,.8,.8] );

	this.each( function(square) { square.style = 0 } );

	var x = [ this.viewX, this.viewY ];

	var ca = raycast.center_angle( x );
	var ext = raycast.extent( x );
	var range = (x[0])*(x[0]) + (x[1])*(x[1]);
	var interval = intervals.boundingInterval( ca+ext, ca-ext);
	
	var resultIv;
	var blocked = true;
	this.lineOfSight( interval, range, function(y,state,iv) {
	    if( y[0] == x[0] && y[1] == x[1] ) {
		if( state == 0 ) {
		    // we found a clear path!
		    resultIv = iv;
		    blocked = false;
		    return true;
		} else {
		    resultIv = iv;
		    blocked = true;
		}
	    }
	});
	
	this.lineOfSight( resultIv,range, function(y,state,iv) {
	    var square = self.getSquare( y[0], y[1] );
	    if( !square || !square.cell) {
		self.set(y[0],y[1],"?", [.8,.8,.8],null,0 , 0);
		square = self.getSquare( y[0], y[1] );
	    }
	    if( blocked ) {
		square.style = blockedColor + 1 - square.colorIndex;
	    } else {
		square.style = 1 - square.colorIndex;
	    }
	});

    },
    fire: function(projectile) {
	var self = this;

	this.each( function(square) { square.style = 0 } );

	var x = [ this.viewX, this.viewY ];

	var ca = raycast.center_angle( x );
	var ext = raycast.extent( x );
	var range = (x[0])*(x[0]) + (x[1])*(x[1]);
	var interval = intervals.boundingInterval( ca+ext, ca-ext);
	
	var furthest = -1;
	var start = this.getSquare(0,0);
	var f_square = start;
	this.lineOfSight( interval, range, function(y,state,iv) {
	    var square = self.getSquare( y[0], y[1] );
	    var cell = square && square.cell;
	    if(!cell)
		return;
	    var r = y[0]*y[0] + y[1]*y[1];
	    if( r > furthest && !cell.unenterable ) {
		furthest = r;
		f_square = square;
	    }
	});
	
	projectile.transform( xforms.inverse[ start.tform ] );
	projectile.transform( f_square.tform );
	projectile.container.removeContents( projectile );
	f_square.cell.addContents( projectile );
    },

    clear:  function() {
	for(var j=0; j<this.height; ++j) {
	    for(var i=0; i< this.width; ++i) {
		if( this.screen[j][i] )
		    this.screen[j][i] = {colorIndex:0, style:0};
	    }
	}
    },
    set: function(x,y,display,color,cell,tform,style) {
	style = style || 0;

	if(!color)
	    return false;
	if( color[0] < 0.05 && color[1] < 0.05 && color[2] < 0.05 )
	    return false;
	if(!display)
	    return false;

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
	    style: style
	}
	return true;
    },
    setlazy: function(x,y,display,color,cell,tform,style) {
	style = style || 0;

	if(!color)
	    return false;
	if( color[0] < 0.05 && color[1] < 0.05 && color[2] < 0.05 )
	    return false;
	if(!display)
	    return false;

	//colorIndex = colors.closestColorIndex(color);

	var row = y+this.c_row;
	var col = x+this.c_col;

	this.screen[row][col] = { 
	    x: x,
	    y: y,
	    display: display,
	    //colorIndex: colorIndex,
	    cell: cell,
	    tform: tform,
	    color: color,
	    style: style
	}
	return true;
    },
    inView: function(x,y) {
	var row = y+this.c_row;
	var col = x+this.c_col;
	
	return row>=0 && col>=0 && col< this.width && row < this.height
    },
    getSquare: function(x,y) {
	if( !this.inView(x,y) )
	    return null;

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
	if( square && square.cell ) {
	    return square.cell.getDescription( square.tform );
	}
	else
	    return "Unable to see location.";
    },
    enterLookMode: function(input) {
	this.viewX = 0;
	this.viewY = 0;
	this.lookMode = true;
    },
    exitLookMode: function() {
	this.textWin.erase();
	this.lookMode = false;
    },
    enterTargetMode: function(input) {
	this.viewX = 0;
	this.viewY = 0;
	this.targetMode = true;
    },
    exitTargetMode: function() {
	this.textWin.erase();
	this.targetMode = false;
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
    selectView: function(dx,dy,input) {
	if( ! this.inView( dx, dy ) ) {
	    input.cancel();
	} else {
	    var square = this.getSquare( dx, dy );
	    var cell = square && square.cell;
	    var keymap = cell && cell.actions && cell.actions();
	    if( !keymap )
		input.cancel();
	    else
		input.setSelectionKeymap( cell, keymap );
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
    },
    select_n: function(input) {
	this.selectView(0,-1,input);
    },
    select_s: function(input) {
	this.selectView(0,1,input);
    },
    select_e: function(input) {
	this.selectView(1,0,input);
    },
    select_w: function(input) {
	this.selectView(-1,0,input);
    },
    select_ne: function(input) {
	this.selectView(1,-1,input);
    },
    select_nw: function(input) {
	this.selectView(-1,-1,input);
    },
    select_se: function(input) {
	this.selectView(1,1,input);
    },
    select_sw: function(input) {
	this.selectView(-1,1,input);
    },
    select_center: function(input) {
	this.selectView(0,0,input);
    },
    lineOfSight: function(interval, range, cb) {
	var initial_interval = intervals.boundingInterval( ca + ext, ca - ext );
	var firstJob = { i: interval,
			 x: [0,0],
			 state: 0 // not blocked
		       }
	var queue = [firstJob];
	var done = false;
	while( !done && queue.length > 0) {
	    var job = queue.shift();
	    var x = job.x;
	    var square = this.getSquare( x[0], x[1] );

	    done = cb( x, job.state, job.i );
	    
	    if( done )
		continue;

	    var cell = square && square.cell;
	    var iv;
	    var blocked_iv;
	    if( job.state == 0 ) {
		if( !cell || cell.isBlocking()  ) {
		    iv = [];
		    blocked_iv = job.i;
		} else if( cell.isOccluding() ) {
		    var ca = raycast.center_angle( job.x );
		    var ext = raycast.extent( job.x );
	 	    var occlusion = intervals.boundingInterval( ca + ext, ca - ext );
		    blocked_iv = intervals.intersection( occlusion, job.i );
		    iv = intervals.difference( job.i, blocked_iv );
		} else {
		    blocked_iv = [];
		    iv = job.i;
		}
	    } else {
		blocked_iv = job.i;
		iv = [];
	    }

	    if( job.x[0] * job.x[0] + job.x[1] * job.x[1] < range ) {
		var exits = raycast.exitIntervals( job.x[0], job.x[1] );
		_.each( exits,  function(exit) {
		    var iva = intervals.intersection( iv, exit.i );
		    var ivb = intervals.intersection( blocked_iv, exit.i );
		    if( iva.length > 0 )
			queue.push( { i: iva, state: 0, x: exit.x } );
		    if( ivb.length > 0 )
			queue.push( { i: ivb, state: 1, x: exit.x } );
		});
	    }
	}
    }    
}

var vision = exports.vision = function (actor, view) {
    var queue = [];

    var initial_interval = [-Math.PI, Math.PI ];    
    var d = _.clone( actor.position );
    var map = actor.map;

    map.clearVisible();
    view.clear();
    view.recall(actor.memory);

    var firstJob = { map: map, 
		     i: initial_interval, 
		     x: [0,0], 
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
    	
	if( view.setlazy( N,M, processedRays.display, color, cell, processedRays.t ) ) {
	    if( ( N!=0 || M!=0 ) &&
		( processedRays.t == actor.tform ) &&
		( actor.position[0] == job.d[0] && actor.position[1] == job.d[1] )
	      )
		actor.memory.imprint( [N,M], processedRays.display);
	}

	//_.each( processedRays.ivs,  function( iv_plus ) {
	for( var ivs_i = 0; ivs_i < processedRays.ivs.length; ++ivs_i) {
	    var iv_plus = processedRays.ivs[ivs_i];
	    var exits = raycast.exitIntervals( N, M );
	    //_.each( exits,  function(exit) {
	    for(var exits_i = 0; exits_i < exits.length; ++exits_i ) {
		var exit = exits[ exits_i ];
		var newIv = intervals.intersection( iv_plus.i, exit.i );
		if(newIv.length > 0) {
		    var newJob =
			{i: newIv, 
			 fl: cell.light, 
			 x: exit.x,
			 d: iv_plus.d || job.d,
			 t: _.isUndefined( iv_plus.t ) ? job.t : iv_plus.t,
			 c: iv_plus.c || job.c,
			 map: iv_plus.map || job.map
			};

			//{ map: map, 
			//  i: initial_interval, 
			//  x: [0,0], 
			//  t: actor.tform, 
			//  d: d, 
			//  c: 1,
			//  fl: true
			//};


		    queue.push( newJob );
		}
	    }
	    //});
	}
	//});
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
