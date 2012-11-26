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

var angle = exports.angle = function(n,m) {
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


var vertex_angle = exports.vertex_angle = function(n,m) {
    return angle(2*n+1, 2*m+1)
}

var center_angle = exports.center_angle = function(n,m) {
    if( _.isArray(n) ) {
	return angle(n[0], n[1] );
    } else {
	return angle(n,m);
    }
}


// Compute 1/2r. This is useful for
// computing the angular extent of circular
// objects at the center of a square.
var extent = exports.extent = function(n,m) {
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
var exitIntervals = exports.exitIntervals = function(n,m) {
    var key = memo_key(n,m);

    if( !xIv_memo[key] ) {
	xIv_memo[key] = exitIntervals_nomemo(n,m);
    }
    return xIv_memo[key];
}
