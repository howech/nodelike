var intervals = require('./intervals');
var raycast = require('./raycast');

var _ = require('underscore');
var xforms = require('./xforms');
var colors = require('./colors');

var defaultColor = [.8,.8,.8];
var ambientLight = 1;

var nc;// = require('ncurses');

var cellPrototype = {
    isCell: true,
    tryExit: function( actor ) {
	return true;
    },
    tryEnter: function( actor ) {
	if( this.containsActor ) {
	    this.contents[0].attacked_by(actor);
	    return false;
	}
	if( this.creatures && this.creatures.length > 0) {
	    actor.attack( this.creatures[0] );
	    return false;
	}
	var blocker = _.find( this.enterActions, function(item) {
	    return !item.tryEnter(actor);
	});
	if( blocker )
	    return false;
	
	return true;
    },
    exit: function( actor ) {
	this.removeContents(actor);
	return true;
    },
    enter: function( actor ) {
	var blocker = _.find( this.enterActions, function(item) {
	    return item.enter(actor);
	});

	if( blocker )
	    return true;
	
	this.addContents(actor);
	actor.setPosition( this.x, this.y );
	return true;
    },
    symbol: '.',
    isBlocking: function() {
	return this.blocking;
    },
    isOccluding: function() {
	return this.occluding;
    },
    getSymbol: function(tform) {
	return { display: this.symbol,
		 color: this.color || [.8,.8,.8] };
    },
    //getColor: function(mask) {
//	var c = this.color || defaultColor;
//	if( mask ) {
//	    c = colors.colorMask(c, mask );
//	}
//	return c;
//    },
    getMapSymbol: function(tform) {
	return this.getContentsSymbol(tform) ||
	    this.getSymbol(tform);
    },
    getDescription: function(tform) {
	return this.description || "";
    },
    clearLight: function(static_light) {
	if( !static_light ) {
	    this.light = false;
	} else {
	    this.light = this.static_light;
	}
    },
    processLightRays: function( rayJob ) {
	this.light = true;
	var ivs = [];

	_.each( this.rayProcessors, function( item ) {
	    ivs = ivs.concat( item.processRaysIvs(rayJob) );
	});
	ivs = ivs.concat( this.processRaysIvs(rayJob)); 

	return { ivs: ivs } ;
    },
    processRays: function( rayJob ) {
	var ivs = [];

	var display_color = this.getMapSymbol(rayJob.t);

	display_color.color = colors.colorMask( display_color.color, rayJob.c );

	if( this.tint ) {
	    rayJob.c = colors.colorMask( this.tint, rayJob.c )
	}

	_.each( this.rayProcessors, function( item ) {
	    ivs = ivs.concat( item.processRaysIvs(rayJob) );
	});
	ivs = ivs.concat( this.processRaysIvs(rayJob)); 

	if( (this.blocking && !rayJob.fl ) || 
	    ( !this.blocking && !this.light ) ) {
	    delete display_color.color;
	    delete display_color.display;
	}
	return { ivs: ivs,
		 t: rayJob.t,
		 display: display_color.display,
		 color: display_color.color 
	       };
    },
    processCreatureRays: function( rayJob ) {
	var ivs = [];
	
	var target = this.containsActor;
    
	_.each( this.rayProcessors, function( item ) {
	    ivs = ivs.concat( item.processRaysIvs(rayJob) );
	});
	ivs = ivs.concat( this.processRaysIvs(rayJob)); 
	
	return { ivs: ivs,
		 t: rayJob.t,
		 target: target,
	       };
    },
    processRaysIvs: function( rayJob ) {
	return [ { i: rayJob.i } ];
    },
    clearVisible: function() { 
	this.visible = false; 
	this.wakeUp = false; 
    },
    setVisible: function()   { this.visible = true;  },
    initialize: function(symbol)  {
	this.x = -1; this.y = -1;
	this.visible = false;
	this.contents = [];
	if(symbol)
	    this.symbol = symbol;
    },
    getContentsSymbol: function(tform) {
	if( this.contents.length > 0 ) {
	    return { 
		display: this.contents[0].symbol, 
		color: this.contents[0].color || [.8,.8,.8] 
	    };
	}
	return null;
    },
    summarizeContents: function() {
	var contents = this.contents;

	this.containsActor = _.any( contents, function(item) { return item.isActor; });
	this.enterActions = _.select( contents, function(item) { return item.enterAction });
	this.rayProcessors = _.select( contents, function(item) { return item.enterAction });

	var lsCount = this.lightSources && this.lightSources.length;
	this.lightSources = _.select( this.contents, function(item) { return item.lightSource });
	var newLScount = this.lightSources && this.lightSources.length;

	if( lsCount != newLScount ) 
	    this.map.static_light = false;

	this.creatures = _.select( contents, function(item) { return item.isCreature });
    },
	    
    addContents: function( object ) {
	this.contents.push( object );
	this.contents = _.sortBy( this.contents, function(item,i) { return item.order } );
	object.container = this;
	this.summarizeContents();
    },
    removeContents: function( obj ) {
	this.contents = _.without( this.contents, obj );
	obj.container = null;
	this.summarizeContents();
    },
    inventory: function( input ) {
	var items = _.filter( this.contents, function(item) { return item.holdable } );
	
	var keymap = { z: "cancel",
		       _handler: function( item ) {
			   this.actor.container.select_item( item, input );
		       }
		     };

	for(i=0;i<25 && i<items.length; ++i) {
	    keymap[ String.fromCharCode( 'a'.charCodeAt(0) + i ) ] = items[i];
	}
	
	input.setSelectionKeymap( null, keymap );
    },
    select_item: function(item,input) {
	var keymap = item && _.isFunction( item.actions ) && item.actions();
	if( !keymap )
	    input.cancel();
	else {
	    if(!keymap[','] ) {
		keymap[','] = "actor.take_it";
	    }
	    input.setSelectionKeymap( item, keymap );
	}
    }
}

var EmptyCell = exports.EmptyCell = function(sym) {
    this.initialize(sym);
}

exports.EmptyCell.prototype = cellPrototype;

var WallCell = exports.WallCell = function(sym) {
    sym = '#' || sym;
    this.initialize(sym);
    this.blocking = true;
    this.unenterable = true;
    this.description = "A wall.";
}

exports.WallCell.prototype = _.extend(
    new EmptyCell(),
    { 
	processRaysIvs: function(rayJob) {
	    return [];
	},
	tryEnter: function( actor ) {
	    return false;
	}
    }
);

var OccludingCell = exports.OccludingCell = function(sym) {
    sym = 'o' || sym;
    this.initialize(sym);
    this.description = "A column.";
    this.occluding = true;
    this.unenterable = true;
}

exports.OccludingCell.prototype = _.extend(
    new EmptyCell(),
    { 
	processRaysIvs: function(job) {
	    var ca = raycast.center_angle( job.x );
	    var ext = raycast.extent( job.x );
	    var occlusion = intervals.boundingInterval( ca + ext, ca - ext );
	    var remaining_transmissions = intervals.difference( job.i, occlusion );
	    return [ { i: remaining_transmissions } ];
	},
	tryEnter: function( actor ) {
	    return false;
	}
    }
);


var CandleCell = exports.CandleCell = function(sym) {
    sym = sym || "'" ;
    this.initialize(sym);
    this.staticLightSource = true;
    this.description = "A candle.";
};

exports.CandleCell.prototype = _.extend(
    new EmptyCell(),
    {
	getStaticLightSource: function() {
	    if( ! this.lightSourceObject )
		this.lightSourceObject = {
		    interval: [-Math.PI, Math.PI ],
		    position: [ this.x, this.y ],
		    tform: 0,
		    color: [0.8,0.8,0.5],
		    range: 10
		};
	    return this.lightSourceObject;
	},
	actions: function() {
	    if(this.staticLightSource) {
		return { b: "selection.blow_out" }
	    } else {
		return { l: "selection.light_candle" }
	    }
	},
	blow_out:  function(input) {
	    this.staticLightSource = false;
	    if( this.map )
		this.map.static_light = false;
	    this.color = [.5,.5,.5];
	    if( input )
		input.cancel();
	},
	light_candle:  function(input) {
	    this.staticLightSource = true;
	    if( this.map )
		this.map.static_light = false;
	    this.color = [.8,.8,.5];
	    if(input)
		input.cancel();
	}
    });



// This table shows how mirrors transform under the group of eight. We
// need this because light will interact with the transformed mirror
// instead of the actual mirror as seen on the map.
var mirror_transforms = exports.mirror_transforms =
    { '|':  [ '|',  '|',  '|',  '|',  '-',  '-',  '-',  '-' ],
      '-':  [ '-',  '-',  '-',  '-',  '|',  '|',  '|',  '|' ],
      '+':  [ '+',  '+',  '+',  '+',  '+',  '+',  '+',  '+' ],
      '/':  [ '/', '\\', '\\',  '/', '\\', '\\',  '/',  '/' ],
      '\\': ['\\',  '/',  '/', '\\',  '/',  '/', '\\', '\\' ]
    };

var MirrorCell = exports.MirrorCell = function(symbol) {
    this.initialize(symbol);
    this.blocking = false;
    this.description = "A mirror.";
    this.unenterable = true;
}


function general_reflection(job, reflections) {
    var cell = job.cell;
    var result = [];

    _.each( reflections, function(reflection) {
	var iv = intervals.intersection( job.i, reflection.i );
	var t = xforms.xtable[job.t][reflection.t];
	var d = xforms.transform( job.x, xforms.xtable[3][t], [cell.x, cell.y] );
	result.push( { i:iv, t: t, d: d } );
    });

    return result;
}

function process_rays_vertical_mirror(job) {
    var N = job.x[0];
    var M = job.x[1];

    var refInterval = intervals.boundingInterval( 
	raycast.center_angle(2*N, 2*M-1), 
	raycast.center_angle(2*N, 2*M+1) 
    );

    return general_reflection(job, [ 
	{i: refInterval, t: 1}, 
	{i: intervals.invert( refInterval ), t: 0 }
    ]);
}

function process_rays_horizontal_mirror(job) {
    var N = job.x[0];
    var M = job.x[1];

    var refInterval = intervals.boundingInterval( 
	raycast.center_angle(2*N-1, 2*M), 
	raycast.center_angle(2*N+1, 2*M) 
    );

    return general_reflection(job, [ 
	{i: refInterval, t: 2}, 
	{i: intervals.invert( refInterval ), t: 0 }
    ]);
}

function process_rays_slash_mirror(job) {
    var N = job.x[0];
    var M = job.x[1];

    var refInterval = intervals.boundingInterval( 
	raycast.vertex_angle(N-1, M), 
	raycast.vertex_angle(N, M-1) 
    );

    return general_reflection(job, [ 
	{i: refInterval, t: 7}, 
	{i: intervals.invert( refInterval ), t: 0 }
    ]);
}

function process_rays_bash_mirror(job) {
    var N = job.x[0];
    var M = job.x[1];

    var refInterval = intervals.boundingInterval( 
	raycast.vertex_angle(N-1, M-1), 
	raycast.vertex_angle(N, M) 
    );

    return general_reflection(job, [ 
	{i: refInterval, t: 6}, 
	{i: intervals.invert( refInterval ), t: 0 }
    ]);
}


function process_rays_plus_mirror(job) {
    var N = job.x[0];
    var M = job.x[1];
    var refInterval = intervals.boundingInterval( raycast.center_angle(2*N+1, 2*M), 
						  raycast.center_angle(2*N-1, 2*M), 
						  raycast.center_angle(2*N, 2*M+1), 
						  raycast.center_angle(2*N, 2*M-1) );
    var hInterval = intervals.boundingInterval(  raycast.center_angle(2*N, 2*M+1), 
						 raycast.center_angle(2*N, 2*M-1) );
    var vInterval = intervals.boundingInterval(  raycast.center_angle(2*N+1, 2*M), 
						 raycast.center_angle(2*N-1, 2*M) );
    var bothInterval = intervals.intersection( hInterval, vInterval );
    var noneInterval;

    hInterval = intervals.difference( hInterval, bothInterval );  // horizontal only reflections
    vInterval = intervals.difference( vInterval, bothInterval );  // vertical only reflections	    
    noneInterval = intervals.difference( job.i, refInterval );

    return general_reflection( job, [
	{ i: noneInterval, t: 0 },
	{ i: hInterval, t: 1 },
	{ i: vInterval, t: 2 },
	{ i: bothInterval, t:3 }
    ]);
}

exports.MirrorCell.prototype = _.extend(
    new EmptyCell(),
    { 
	getSymbol: function(tform) {
	    return { display: mirror_transforms[this.symbol][tform||0],
		     color: this.color || [.8,.8,.8]
		   };
	},
	mirror_actions:  {
	    '|':  process_rays_vertical_mirror,
	    '-':  process_rays_horizontal_mirror,
	    '+':  process_rays_plus_mirror,
	    '/':  process_rays_slash_mirror,
	    '\\': process_rays_bash_mirror 
	},
	processRaysIvs: function(job) {
	    job.cell = this;
	    var mirror = this.getSymbol( job.t ).display;
	    var result = this.mirror_actions[ mirror ](job);	
	    return result;
	},
	tryEnter: function( actor ) {
	    if( this.enchanted ) {
		var symbol = this.getSymbol( actor.tform ).display;
		actor.transform( { '|': 1, '-': 2, '+': 3, '/' : 7, '\\': 6 }[symbol] );
	    }
	    return false;
	}
    }
);


// process_ray jobs look like this:
// { i: [0,1]                - angular interval for ray bundle
//   x: [n,m]                - coordinates in visual space
//   t: t                    - integer representing one of the eight possible 
//                             linear transforms to get to map space
//   d: [dx, dy]             - constant to add to transform to get to map space
//   r: [lastH, lastV]       - reflection state vector 
//   c: [ r, g, b ]          - color mask
// }


var GateWayCell = exports.GateWayCell = function(symbol, tx, ty) {
    this.initialize(symbol);
    this.target = [tx,ty];
    this.description = "A magical gateway to parts unknown.";
    this.enter_tform = 0;
    this.exit_tform = 0;
}

exports.GateWayCell.prototype = _.extend(
    new EmptyCell(),
    {
	gateWayTform: function(t) {
	    var limbo = xforms.xtable[t][this.enter_tform];
	    var tcell = this.map.getCell( this.target[0], this.target[1] );
	    var target_tform = tcell.exit_tform || 0;
	    return xforms.xtable[limbo][target_tform];
	},
	processRaysIvs: function(job) {    
	    var t = this.gateWayTform( job.t );
	    
	    if( job.x[0] == 0 && job.x[1] == 0 ) {
		return [ { i: job.i, t: job.t, d: job.d } ];
	    }
	    
	    var d = xforms.transform( job.x, xforms.xtable[3][t], this.target );
            return [ { i:job.i, t: t, d: d } ];
	},
	tryEnter: function(actor) {
	    var tcell = this.map.getCell( this.target[0], this.target[1] );
	    return true;
	},	    
	enter: function( actor ) {
	    var tcell = this.map.getCell( this.target[0], this.target[1] );
	    tcell.addContents(actor);
	    actor.setPosition( this.target[0], this.target[1] );
	    actor.transform( this.gateWayTform( 0 ) );    
	    return true;
	}
    }
);    









