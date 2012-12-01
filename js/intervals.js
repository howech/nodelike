var _ = require('underscore');

// Given a group of angles, this function computes
// the an interval that covers them. It is assumed
// that the group of angles can be covered by an
// angle that is less than PI radians.
exports.boundingInterval = function boundingInterval() {
    var angles;

    if( _.isArray( arguments[0] ) )
	angles = arguments[0];
    else
	angles = arguments;

    angles = _.map( angles, function(angle) {
	while( angle > Math.PI ) {
	    angle -= 2*Math.PI;
	}
	while( angle < -Math.PI ) {
	    angle += 2*Math.PI;
	}
	return angle;
    });

    var min, max;
    
    if( angles.length < 2) {
	return []
    }

    min = _.min( angles, function(x) { return x; } );
    max = _.max( angles, function(x) { return x; } );
    
    if( max - min <= Math.PI ) {
	if(min < max)
	    return [min, max];
	else
	    return [];
    } else {
	min = _.min(angles, function(x) { 
	    if(x<0)
		return x + 2*Math.PI;
	    else
		return x;
	});
	max = _.max(angles, function(x) { 
	    if(x>0)
		return x - 2*Math.PI;
	    else
		return x;
	});
	result = [];
	if( max > -Math.PI ) {
	    result.push( -Math.PI );
	    result.push(max);
	}

	if( min < Math.PI ) {
	    result.push(min);
	    result.push(Math.PI);
	}

	return result;
    }
}

// Make sure there are no repeated numbers in the set.
exports.normalize = function normalize( iva ) {
    var result = [];
    var last = null;
    var ok = true;
    for(i = 1; i< iva.length && ok; ++i) {
	ok = iva[i-1] != iva[i];
    }
    if(ok)
	return(iva);

    iva.forEach( function(x) {
	if(last == null) {
	    last = x;
	} else if(x == last) {
	    last = null;
	} else {
	    result.push(last);
	    last = x;
	}
    });

    if( !_.isNull(last) )
	result.push(last);


    return result;		
}

exports.intersection = function intersection( iva, ivb ) {
    var result = [];
    
    var insideA = false;
    var insideB = false;
    var insideC = false;

    var i=0, j=0;
    var x;

    while( i < iva.length || j < ivb.length ) {
	if( j >= ivb.length || ( i < iva.length && iva[i] < ivb[j] ) )  {
	    x = iva[i];
	    i++;
	    insideA = !insideA;
	} else {
	    x=ivb[j];
	    j++;
	    insideB = !insideB;
	}
	
	if( insideA && insideB && !insideC ) {
	    insideC = true;
	    result.push(x);
	} else if (insideC && (!insideA || !insideB) ) {
	    insideC = false;
	    result.push(x);
	}
    }

    return exports.normalize(result);
}

exports.union = function union( iva, ivb ) {
    var result = [];
    
    var insideA = false;
    var insideB = false;
    var insideC = false;

    var i=0, j=0;
    var x;

    while( i < iva.length || j < ivb.length ) {
	if( j >= ivb.length || ( i < iva.length && iva[i] < ivb[j] ) )  {
	    x = iva[i];
	    i++;
	    insideA = !insideA;
	} else {
	    x=ivb[j];
	    j++;
	    insideB = !insideB;
	}
	
	if( (insideA || insideB) && !insideC ) {
	    insideC = true;
	    result.push(x);
	} else if (insideC && (!insideA && !insideB) ) {
	    insideC = false;
	    result.push(x);
	}
    }

    return exports.normalize(result);
}

exports.invert = function invert( iva ) {
    var result = _.map( iva, function(x) { return x;} );
    
    if( result.length == 0 )
	return [ -Math.PI, Math.PI ];

    if(result[0] == -Math.PI) {
	result.shift();
    } else {
	result.unshift(-Math.PI);
    }

    if(result[ result.length-1 ] == Math.PI ) {
	result.pop();
    } else {
	result.push( Math.PI );
    }

    return result;
}

exports.difference = function difference( iva, ivb ) {
    return exports.intersection( iva, exports.invert(ivb) );
}

exports.measure = function(iv) {
    var sum = 0;
    for(var i=0; i<iv.length; i+=2) {
	sum += iv[i+1]-iv[i];
    }
    return sum;
}