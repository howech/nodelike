var intervals = require('./intervals');
var raycast = require('./raycast');

var _ = require('underscore');
var xforms = require('./xforms');
var colors = require('./colors');

var defaultColor = [.8,.8,.8];
var ambientLight = 1;

var nc = require('ncurses');

var cellPrototype = {
    tryExit: function( actor ) {
	return true;
    },
    tryEnter: function( actor ) {
	return true;
    },
    exit: function( actor ) {
	this.removeContents(actor);
	return true;
    },
    enter: function( actor ) {
	this.addContents(actor);
	actor.setPosition( this.x, this.y );
	return true;
    },
    symbol: '.',
    getSymbol: function(tform) {
	return this.symbol;
    },
    getColor: function(mask) {
	var c = this.color || defaultColor;
	if( mask ) {
	    c = colors.colorMask(c, mask );
	}
	return c;
    },
    getMapSymbol: function(tform) {
	return this.getContentsSymbol(tform) ||
	    this.getSymbol(tform);
    },
    getDescription: function(tform) {
	return JSON.stringify( this.light );
    },
    processColors: function( rayJob ) {
	var c = this.getColor( rayJob.c );

	if( this.tint )
	    rayJob.c = colors.colorMask( this.tint, rayJob.c );

 	return c;
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
	return { ivs: this.processRaysIvs( rayJob ) };
    },
    processRays: function( rayJob ) {
	var color = this.processColors( rayJob );
	var display = this.getMapSymbol(rayJob.t);
	if( this.blocking ) {
	    display = rayJob.fl ? display : null;
	} else {
	    display = this.light ? display : null;
	}
	return { ivs: this.processRaysIvs(rayJob), 
		 display: display,
		 color: color,
		 t: rayJob.t
	       };
    },
    processRaysIvs: function( rayJob ) {
	return [ { i: rayJob.i } ];
    },
    clearVisible: function() { this.visible = false; },
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
	    return this.contents[0].symbol;
	}
	return null;
    },
    addContents: function( object ) {
	this.contents.push( object );
    },
    removeContents: function( obj ) {
	this.contents = _.without( this.contents, obj );
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
    this.blocking = true;
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
	    return mirror_transforms[this.symbol][tform||0];
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
	    var mirror = this.getSymbol( job.t );
	    var result = this.mirror_actions[ mirror ](job);	
	    return result;
	},
	tryEnter: function( actor ) {
	    if( this.enchanted ) {
		var symbol = this.getSymbol( actor.tform );
		actor.transform( { '|': 1, '-': 2, '+': 3, '/' : 7, '\\': 6 }[symbol] )
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
}

exports.GateWayCell.prototype = _.extend(
    new EmptyCell(),
    {
	processRaysIvs: function(job) {    
	    if( job.x[0] == 0 && job.x[1] == 0 ) {
		return [ { i: job.i, t: job.t, d: job.d } ];
	    }

	    var d = xforms.transform( job.x, xforms.xtable[3][job.t], this.target );
            return [ { i:job.i, t: job.t, d: d } ];
	},
	tryEnter: function(actor) {
	    var tcell = this.map.getCell( this.target[0], this.target[1] );
	    return this.contents.length == 0 && tcell.contents.length == 0;
	},	    
	enter: function( actor ) {
	    var tcell = this.map.getCell( this.target[0], this.target[1] );
	    tcell.addContents(actor);
	    actor.setPosition( this.target[0], this.target[1] );
	}
    }
);    









