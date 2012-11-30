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

function mult(a,b) {
    return [ a[0] * b[0] + a[1] * b[2],
	     a[0] * b[1] + a[1] * b[3],
	     a[2] * b[0] + a[3] * b[2],
	     a[2] * b[1] + a[3] * b[3],
	   ];
}

function lookup(a) {
    for(var i=0; i<8; ++i) {
	if( a[0] == xforms[i][0] &&
	    a[1] == xforms[i][1] &&
	    a[2] == xforms[i][2] &&
	    a[3] == xforms[i][3] )
	    return i;
    }
    return null;
}

table = [];
for( var i=0; i<8; ++i) {
    table[i] = [];
    for(var j=0; j<8; ++j) {
	var x = mult( xforms[i], xforms[j] );
	table[i][j] = lookup(x);
    }
}

console.log( JSON.stringify( table ) );