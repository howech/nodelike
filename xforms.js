// The following are all of the operations that comprise the
// group formed by 90' rotations and reflections about the x
// and y axes.
var xforms = exports.xforms = [
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
var xtable = exports.xtable = 
    [ [0,1,2,3,4,5,6,7],
      [1,0,3,2,7,6,5,4],
      [2,3,0,1,6,7,4,5],
      [3,2,1,0,5,4,7,6],
      [4,6,7,5,3,0,2,1],
      [5,7,6,4,0,3,1,2],
      [6,4,5,7,1,2,0,3],
      [7,5,4,6,2,1,3,0] ];


// return t*x + d
var transform = exports.transform = function( x, t, d) {
    tf = xforms[t];
    return [ x[0] * tf[0] + x[1] * tf[1] + d[0],
	     x[0] * tf[2] + x[1] * tf[3] + d[1] ]
}
