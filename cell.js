
var intervals = require('./intervals');
var _ = require('underscore');

// raycast:
// (x,y) = (r cos theta, r sin theta)
//    +-------+-------+-/-----+ 
//    |       | (0,1) |/      |
//    |       |   .   /       |
//    |       |      /|       |
//    +-------+-----/-+-------+ 
//    |       |    /  |       |
//    |       |   .   |       |
//    |       | (0,0) |       |
//    +-------+-------+-------+ 
//    |       |       |       |
//    |       |       |       |
//    |       |       |       |
//    +-------+-------+-------+ 
//
//
// Rays start at (0,0) and radiate outwards. 

// 
// Verticies appear at ponts ( n + 1/2, m + 1/2). 
//   theta = Math.atan2( m+1/2, n+1/2)
//
// Interesting points for the cell at (n,m) are found at
// angle(n,m), angle(n-1,m), angle(n-1,m-1), angle(n,m-1).
// The extent of the cell is from min( angles ) to max( angles).
// however, if max-min > PI, the extents are from min( +pv angles)
// to PI and from -PI to (max -ve angles)
// 
// If the vertexes are listed in ccw order, start at the min,
// and proceed to the max. These are the outgoing vertexes. If 
// one was skipped, it it the incoming vertex.  
// 
// For a given cell (n,m) and a given ray (theta) what happens to the
// beam of light?
//
// angles = [ angle(n,m), angle(n-1,m), angle(n-1,m-1), angle(n-m) ]
// min = index of smallest angle, max = index of largest angle
// if(max - min) > PI then subtract 2PI from all positive angles, subtract 2PI from
// theta if it is positive
// 
// Get the intervals for the exiting walls. These will be in the form of
// { minAngle, maxAngle, deltaX deltaY }


// Compute the greatest common divisor of two integers.
function gcd(a,b) {
    if(a<0) 
	a = -a;
    if(b<0) 
	b = -b;
    if( a < b ) {
	var x = a;
	a = b;
	b = x;
    }

    while( b > 0) {
	var x = b;
	b = a % b;
	a = x;
    }
    
    return a;
}


var angle_memo = {};
var extent_memo = {};

function memo_key(n,m) {
    return n + "_" + m;
}
function angle(n,m) {
    // Scale n and m down to their
    // smallest ratio. This helps to 
    // save space in the angle memo table.

    var d = gcd(n,m);
    n = n / d;
    m = m / d;
    
    key = memo_key(n,m);

    if( !angle_memo[ key ] ) {
	angle_memo[ key ] = Math.atan2(m, n); 
    }

    return angle_memo[ key ];
}


function vertex_angle(n,m) {
    return angle(2*n+1, 2*m+1)
}

function center_angle(n,m) {
    if( _.isArray(n) ) {
	return angle(n[0], n[1] );
    } else {
	return angle(n,m);
    }
}


// Compute 1/2r. This is useful for
// computing the angular extent of circular
// objects at the center of a square.
function extent(n,m) {
    if( _.isArray(n) ) {
	m = n[1];
	n = n[0];
    }
    // collapse symmetries
    if( n < 0 ) 
	n = -n;

    if(m < 0 )
	m = -m;

    if(n < m ) {
	var x = n;
	n = m;
	m = x;
    }
    
    key = memo_key(n,m);
    if(!extent_memo[key]) {
	// figure out the extentd for an object that is radius 0.5
	// If we need bigger or smaller, we can scale from here.
	extent_memo[key] = 0.5 / Math.sqrt( n*n + m*m );
    }
    
    return extent_memo[key];
}

//    +-------+-------+-/-----+ 
//    |       | (0,1) |/      |
//    |       |   .   /       |
//    |       |      /|       |
//    +-------+-----/-+-------+ 
//    |       |    /  |       |
//    |       |   .   |       |
//    |       | (0,0) |       |
//    +-------+-------+-------+ 
//    |       |       |       |
//    |       |       |       |
//    |       |       |       |
//    +-------+-------+-------+ 

// Calculate the angular intervals corresponding to the rays
// that might leave a given cell.
//
// [ { i: [ 0, 1], x: [n,m] } , ... ]

function exitIntervals_nomemo(n,m) {
    var exits = [];
    var a = vertex_angle(n,m),
    b = vertex_angle(n-1,m),
    c = vertex_angle(n-1,m-1),
    d = vertex_angle(n,m-1);
    
    // we can exit to the left if we are not to the right of the origin
    if( n < 1 ) {
	exits.push( {i: intervals.boundingInterval(b,c), x: [n-1,m]} );
    }

    // we can exit to the right if we are not left of the origin
    if( n > -1 ) {
	exits.push( { i: intervals.boundingInterval(a,d), x: [n+1,m] } );
    }

    // we can exit down if we are not above the origin
    if( m < 1 ) {
	exits.push( { i: intervals.boundingInterval(c,d), x: [n,m-1] } );
    }

    // we can exit up if we are not below the origin
    if(  m > -1 ) {
	exits.push( { i: intervals.boundingInterval(a,b), x: [n,m+1] } );
    }

    return exits;
}

var xIv_memo = {}
function exitIntervals(n,m) {
    var key = memo_key(n,m);

    if( !xIv_memo[key] ) {
	xIv_memo[key] = exitIntervals_nomemo(n,m);
    }
    return xIv_memo[key];
}


var display = [];
var map = [];

// The following are all of the operations that comprise the
// group formed by 90' rotations and reflections about the x
// and y axes.
var xforms = [
    [ 1,  0,  0,  1], // Identity
    [-1,  0,  0,  1], // X-ref
    [ 1,  0,  0, -1], // Y-ref
    [-1,  0,  0, -1], // XY-ref, 180' rotation
    [ 0,  1, -1,  0], // 90' rotation
    [ 0, -1,  1,  0], // -90' rotation
    [ 0,  1,  1,  0], // rotref1
    [ 0, -1, -1,  0]  // rotref2
];

// see matmult.js
// This is a multiplication table for the above.
// xform[i] * xform[j] = xform[ xtable[i][j] ]
var xtable = 
    [ [0,1,2,3,4,5,6,7],
      [1,0,3,2,7,6,5,4],
      [2,3,0,1,6,7,4,5],
      [3,2,1,0,5,4,7,6],
      [4,6,7,5,3,0,2,1],
      [5,7,6,4,0,3,1,2],
      [6,4,5,7,1,2,0,3],
      [7,5,4,6,2,1,3,0] ];

function transform( x, t, d) {
    tf = xforms[t];
    return [ x[0] * tf[0] + x[1] * tf[1] + d[0],
	     x[0] * tf[2] + x[1] * tf[3] + d[1] ]
}

// Vision transform jobs look like this:
// { i: [0,1]                - angular interval for ray bundle
//   x: [n,m]                - coordinates in visual space
//   t: t                    - integer representing one of the eight possible 
//                             linear transforms to get to map space
//   d: [dx, dy]             - constant to add to transform to get to map space
//   r: [lastH, lastV]       - reflection state vector 
//   c: [ r, g, b ]          - color mask
// }

function process_rays_occluding_center( job ) {
    var ca = center_angle( job.x );
    var ext = extent( job.x );
    var occlusion = intervals.boundingInterval( ca + ext, ca - ext );
    var remaining_transmissions = intervals.difference( job.i, occlusion );
    
    return { ivs: [ { i: remaining_transmissions } ], 
	     display: 'o' 
	   };
}

function process_rays_wall(job) {
    return { ivs: [],
	     display: '#'
	   }
}

function process_rays_player(job) {
    return { ivs: [ {i: job.i} ],
	     display: '@'
	   }
}

function process_rays_other(job) {
    return { ivs: [ {i: job.i} ],
	     display: '.'
	   }
}

function process_rays_vertical_mirror(job) {
    var result = {};

    var N = job.x[0];
    var M = job.x[1];
    var refInterval = intervals.boundingInterval( center_angle(2*N, 2*M-1), center_angle(2*N, 2*M+1) );
    refInterval = intervals.intersection(job.i, refInterval );
    
    if( refInterval.length > 0) {// && N != job.r[0] ) {
	var ref_tform = xtable[1][job.t];
	// xform[3] is -1
	var ref_d = transform( job.x, xtable[3][ref_tform], job.m );
	result.ivs =[ { i: refInterval, t: ref_tform, d: ref_d, r: [N, job.r[1]] }, // reflect what hit the mirror
		      { i: intervals.difference( job.i, refInterval ) } ]           // transmit the rest
    } else {
	result.ivs = [ {i: job.i} ];
    }
    
    if( job.t < 4 )
	result.display = '|'; // unrotated mirror
    else
	result.display = "-"; // rotated mirror

    return result;
}

function process_rays_horizontal_mirror(job) {
    var result = {};

    var N = job.x[0];
    var M = job.x[1];
    var refInterval = intervals.boundingInterval( center_angle(2*N-1, 2*M), center_angle(2*N+1, 2*M) );
    refInterval = intervals.intersection(job.i, refInterval );
    
    if( refInterval.length > 0 ) {//&& M != job.r[1] ) {
	var ref_tform = xtable[2][job.t];
	// xform[3] is -1
	var ref_d = transform( job.x, xtable[3][ref_tform], job.m );
	result.ivs =[ { i: refInterval, t: ref_tform, d: ref_d, r: [job.r[0], M] }, // reflect what hit the mirror
		      { i: intervals.difference( job.i, refInterval ) } ]           // transmit the rest
    } else {
	result.ivs = [ {i: job.i} ];
    }
    
    if( job.t < 4 )
	result.display = '-'; // unrotated mirror
    else
	result.display = "|"; // rotated mirror

    return result;
}

function process_rays_slash_mirror(job) {
    var result = {};

    var N = job.x[0];
    var M = job.x[1];
    var refInterval = intervals.boundingInterval( vertex_angle(N-1, M), vertex_angle(N, M-1) );
    refInterval = intervals.intersection(job.i, refInterval );
    
    if( refInterval.length > 0 ) {
	var ref_tform = xtable[job.t][7];
	// xform[3] is -1
	var ref_d = transform( job.x, xtable[3][ref_tform], job.m );
	result.ivs =[ { i: refInterval, t: ref_tform, d: ref_d }, // reflect what hit the mirror
		      { i: intervals.difference( job.i, refInterval ) } ]           // transmit the rest
    } else {
	result.ivs = [ {i: job.i} ];
    }
    
    result.display = ['/','\\','\\','/','\\','\\','/','/'][job.t];

    return result;
}


function process_rays_plus_mirror(job) {
    var result = {};

    var N = job.x[0];
    var M = job.x[1];
    var refInterval = intervals.boundingInterval( center_angle(2*N+1, 2*M), center_angle(2*N-1, 2*M), 
						  center_angle(2*N, 2*M+1), center_angle(2*N, 2*M-1) );
    var hInterval = intervals.boundingInterval(  center_angle(2*N, 2*M+1), center_angle(2*N, 2*M-1) );
    var vInterval = intervals.boundingInterval(  center_angle(2*N+1, 2*M), center_angle(2*N-1, 2*M) );
    var bothInterval = intervals.intersection( hInterval, vInterval );
    var noneInterval;

    hInterval = intervals.difference( hInterval, bothInterval );  // horizontal only reflections
    vInterval = intervals.difference( vInterval, bothInterval );  // vertical only reflections
	    
    // now compute intersections with incoming
    bothInterval = intervals.intersection( bothInterval, job.i );
    hInterval    = intervals.intersection( hInterval, job.i );
    vInterval    = intervals.intersection( vInterval, job.i );
    noneInterval = intervals.difference( job.i, refInterval );
    
    result.ivs = _.map( [noneInterval, hInterval, vInterval, bothInterval ], // order important!
			function( iv, t ) {
			    var new_tform = xtable[t][ job.t ];
			    var new_d = transform( job.x, xtable[3][new_tform], job.m );
			    var new_lastH = (t == 0 || t == 2) ? job.r[0] : N;
			    var new_lastV = (t == 0 || t == 1) ? job.r[1] : M;
			    
			    return { i: iv, t: new_tform, d: new_d, r: [new_lastH, new_lastV] };
			});
    result.display = '+';
    return result;
}

var ray_processor = {
    '#': process_rays_wall,
    '@': process_rays_player,
    '+': process_rays_plus_mirror,
    '-': process_rays_horizontal_mirror,
    '|': process_rays_vertical_mirror,
    'o': process_rays_occluding_center,
    '/': process_rays_slash_mirror,
    'default': process_rays_other
};

function vision(n,m) {
    for(var i = 0; i< 30; ++i ) {
	var row = display[i] = [];
	for(var j = 0; j< 30; ++j ) {
	    row[j] = ' ';
	}
    } 

    var queue = [];
             
    queue.push( {i: [-Math.PI, Math.PI], x:[0,0], t:0, d: [n,m], r:[null, null], c:[1,1,1] } );
    
    while(queue.length > 0 ) {
	var job = queue.shift();
	var iv = job.i;

	var N = job.x[0];
	var M = job.x[1];

	var tform = job.t;
	var delta = job.d;

	var lastH = job.r[0];
	var lastV = job.r[1];

	var mapcoords = transform( job.x, job.t, job.d );

	var x = mapcoords[0];
	var y = mapcoords[1];
	job.m = [x,y];

	var X = N + n;
	var Y = M + m;
	job.v = [X,Y];

	// Check for out of bounds
	if(x<0 || x>=30 || y<0 || y>=30) 
	    continue;

	if( X < 0 || X >= 30 || Y < 0 || Y >= 30 )
	    continue;

	// check vision radius
	if( N * N + M * M > 400 )
	    continue;

	if( map[y][x] == '#' ) {
	    display[Y][X] = '#';
	    continue;
	}

	var chr = map[y][x];

	if( !ray_processor[chr] ) 
	    chr = 'default';
	var processed = ray_processor[chr](job);

/*	    
	var ivs = [];

	if(map[y][x] == 'o' ) {
	    var ca = center_angle(N,M);
	    var ext = extent(N,M);
	    var occlusion = intervals.boundingInterval( ca + ext, ca - ext );
	    var remaining_transmissions = intervals.difference( iv, occlusion );

	    ivs = [ { i: remaining_transmissions } ];

	    display[Y][X] = 'o';
	} else if(  map[y][x] == '|' ) {
	    var refInterval = intervals.boundingInterval( center_angle(2*N, 2*M-1), center_angle(2*N, 2*M+1) );
	    refInterval = intervals.intersection(iv, refInterval );

	    if( refInterval.length > 0 && N != lastH ) {
		var ref_tform = xtable[1][tform];
		// xform[3] is -1
		var ref_d = transform( job.x, xtable[3][ref_tform], [x,y] );
		ivs =[ { i: refInterval, t: ref_tform, d: ref_d, r: [N, lastV] }, // reflect what hit the mirror
			     { i: intervals.difference( iv, refInterval ) } ]           // transmit the rest
	    } else {
		ivs = [ {i: iv} ];
	    }
		
	    if( tform < 4 )
		display[Y][X] = '|'; // unrotated mirror
	    else
		display[Y][X] = "-"; // rotated mirror

	} else if( map[y][x] == '-' ) {
	    var refInterval = intervals.boundingInterval( center_angle(2*N+1, 2*M), center_angle(2*N-1, 2*M) );
	    refInterval = intervals.intersection(iv, refInterval );
	    
	    if( refInterval.length && M != lastV ) {
		var ref_tform = xtable[2][tform];
		// xform[3] is -1
		var ref_d = transform( job.x, xtable[3][ref_tform], [x,y] );
		ivs =[ { i: refInterval, t: ref_tform, d: ref_d, r: [lastH, M] }, // reflect what hit the mirror
			     { i: intervals.difference( iv, refInterval ) } ]           // transmit the rest
	    } else {
		ivs = [{i:iv}];
	    }
		
	    if( tform < 4 )
		display[Y][X] = '-'; // unrotated mirror
	    else
		display[Y][X] = "|"; // rotated mirror
	} else if( map[y][x] == '+' ) {
	    var refInterval = intervals.boundingInterval( center_angle(2*N+1, 2*M), center_angle(2*N-1, 2*M), 
							  center_angle(2*N, 2*M+1), center_angle(2*N, 2*M-1) );
	    var hInterval = intervals.boundingInterval(  center_angle(2*N, 2*M+1), center_angle(2*N, 2*M-1) );
	    var vInterval = intervals.boundingInterval(  center_angle(2*N+1, 2*M), center_angle(2*N-1, 2*M) );
	    var bothInterval = intervals.intersection( hInterval, vInterval );
	    var noneInterval;

	    hInterval = intervals.difference( hInterval, bothInterval );  // horizontal only reflections
	    vInterval = intervals.difference( vInterval, bothInterval );  // vertical only reflections
	    
	    // now compute intersections with incoming
	    bothInterval = intervals.intersection( bothInterval, iv );
	    hInterval    = intervals.intersection( hInterval, iv );
	    vInterval    = intervals.intersection( vInterval, iv );
	    noneInterval = intervals.difference( iv, refInterval );
	    
	    ivs = _.map( [noneInterval, hInterval, vInterval, bothInterval ], // order important!
			       function( iv, t ) {
				   var new_tform = xtable[t][tform];
				   var new_d = transform( job.x, xtable[3][new_tform], [x,y] );
				   var new_lastH = (t == 0 || t == 2) ? lastH : N;
				   var new_lastV = (t == 0 || t == 1) ? lastV : M;
				   
				   return { i: iv, t: new_tform, d: new_d, r: [new_lastH, new_lastV] };
			       });
	    display[Y][X] = '+';
	} else {
	    ivs = [{i:iv}]
	    if(map[y][x] == '@')
		display[Y][X] = '@';
	    else
		display[Y][X] = '.';
	}
*/

	display[Y][X] = processed.display;
	processed.ivs.forEach( function( iv_plus ) {
	    var exits = exitIntervals( N, M );
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


for(var i = 0; i< 30; ++i ) {
    var row = display[i] = [];
    var maprow = map[i] = [];
    for(var j = 0; j< 30; ++j ) {
	row[j] = ' ';
	maprow[j] = ' ';
    }
} 

map[5][6] = '#';
map[5][7] = '#';

map[5][9] = '+';
map[5][10] = '-';
map[5][11] = '-';

map[5][12] = '+';
map[5][13] = '-';

map[9][8] = 'o';


map[9][12] = '|';
map[10][12] = '|';
map[8][12] = '|';
map[7][12] = '|';
map[6][12] = '|';

map[9][7] = '|';
map[10][7] = '|';
map[8][7] = '|';
map[7][7] = '|';
map[6][7] = '|';

map[6][20] = '-';
map[7][20] = '/';
map[7][17] = '|';


map[29][29] = '@';
var actor = [29,29];

function move(dx, dy) {
    var old_x = actor[0];
    var old_y = actor[1];

    actor[0] += dx;
    actor[1] += dy;

    if(actor[0] < 0) {
	actor[0] = 0;
    }
    if(actor[0] > 29) {
	actor[0] = 29;
    }
    if(actor[1] < 0) {
	actor[1] = 0;
    }
    if(actor[1] > 29) {
	actor[1] = 29;
    }

    map[old_y][old_x] = ' ';
    map[actor[1]][actor[0]] = '@';

    vision( actor[0], actor[1] );
}

for(var i = 6; i< 26; i+=2)
    for(var j = 13; j< 26; j+=2 )
	map[j][i] = 'o';

for(var i = 6; i<26; i += 2)
    map[26][i] = '#';

var nc = require('ncurses');
var win = new nc.Window();

var displayWin = new nc.Window(32,32);
displayWin.move(1,1);
displayWin.frame();

var viewWin = new nc.Window(32,32);
viewWin.move(1,32);
viewWin.frame();

function onInput(charStr, charCode, isKey) {
    win.addstr(35,0,"Input: '" + charStr + "' (" + charCode + ") - isKey: " + isKey );
    if(charStr == 'q') {
	displayWin.close();
	win.close();
	viewWin.close();
	return;
    }

    
    if(charStr == 'h') {
	move(-1,0);
    }
    if(charStr == 'k') {
	move(0,-1);
    }
    if(charStr == 'j') {
	move(0,1);
    }
    if(charStr == 'l') {
	move(1,0);
    }
    if(charStr == 'y') {
	move(-1,-1);
    }
    if(charStr == 'u') {
	move(1,-1);
    }
    if(charStr == 'b') {
	move(-1,1);
    }
    if(charStr == 'n') {
	move(1,1);
    }
	
    

    viewWin.clear();
    for(var i=0; i<30; ++i) {
	viewWin.addstr(i+1,1, display[i].join("")  );
    }

    displayWin.clear();
    for(var i=0; i<30; ++i) {
	displayWin.addstr(i+1,1, map[i].join("")  );
    }

    viewWin.frame();
    displayWin.frame();
    viewWin.centertext(0, "  Visible  ");
    displayWin.centertext(0, "  Actual  ");
    nc.redraw();    
}

displayWin.on('inputChar', onInput );
viewWin.on('inputChar', onInput );
win.on('inputChar', onInput );

process.on('uncaughtException', function (err) {
    if(win)
	win.close();
    if(displayWin)
	displayWin.close();
    if(viewWin)
	viewWin.close();

    nc.cleanup();
    
    console.log('Caught exception: ')
    throw err;
});


nc.showCursor = false;
vision( actor[0], actor[1] )
onInput('1',1,false);





