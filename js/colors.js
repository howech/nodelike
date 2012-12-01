var nc; // = require('ncurses');
var _ = require('underscore');
var LRU = require('lru-cache');

var colorCache = new LRU(512);

//var LRU = require("lru-cache"), cache = LRU( 512 );

//var hexCodes = exports.hexCodes = [    
//    '000000', '800000', '008000', '808000', '000080', '800080', '008080', 'c0c0c0', //   0
//    '808080', 'ff0000', '00ff00', 'ffff00', '0000ff', 'ff00ff', '00ffff', 'ffffff', //   8
//    '000000', '00005f', '000087', '0000af', '0000d7', '0000ff', '005f00', '005f5f', //  16
//    '005f87', '005faf', '005fd7', '005fff', '008700', '00875f', '008787', '0087af', //  24
//    '0087d7', '0087ff', '00af00', '00af5f', '00af87', '00afaf', '00afd7', '00afff', //  32
//    '00d700', '00d75f', '00d787', '00d7af', '00d7d7', '00d7ff', '00ff00', '00ff5f', //  40
//    '00ff87', '00ffaf', '00ffd7', '00ffff', '5f0000', '5f005f', '5f0087', '5f00af', //  48
//    '5f00d7', '5f00ff', '5f5f00', '5f5f5f', '5f5f87', '5f5faf', '5f5fd7', '5f5fff', //  56
//    '5f8700', '5f875f', '5f8787', '5f87af', '5f87d7', '5f87ff', '5faf00', '5faf5f', //  64
//    '5faf87', '5fafaf', '5fafd7', '5fafff', '5fd700', '5fd75f', '5fd787', '5fd7af', //  72
//    '5fd7d7', '5fd7ff', '5fff00', '5fff5f', '5fff87', '5fffaf', '5fffd7', '5fffff', //  80
//    '870000', '87005f', '870087', '8700af', '8700d7', '8700ff', '875f00', '875f5f', //  88
//    '875f87', '875faf', '875fd7', '875fff', '878700', '87875f', '878787', '8787af', //  96
//    '8787d7', '8787ff', '87af00', '87af5f', '87af87', '87afaf', '87afd7', '87afff', // 104
//    '87d700', '87d75f', '87d787', '87d7af', '87d7d7', '87d7ff', '87ff00', '87ff5f', // 112
//    '87ff87', '87ffaf', '87ffd7', '87ffff', 'af0000', 'af005f', 'af0087', 'af00af', // 120
//    'af00d7', 'af00ff', 'af5f00', 'af5f5f', 'af5f87', 'af5faf', 'af5fd7', 'af5fff', // 128
//    'af8700', 'af875f', 'af8787', 'af87af', 'af87d7', 'af87ff', 'afaf00', 'afaf5f', // 136
//    'afaf87', 'afafaf', 'afafd7', 'afafff', 'afd700', 'afd75f', 'afd787', 'afd7af', // 144
//    'afd7d7', 'afd7ff', 'afff00', 'afff5f', 'afff87', 'afffaf', 'afffd7', 'afffff', // 152
//    'd70000', 'd7005f', 'd70087', 'd700af', 'd700d7', 'd700ff', 'd75f00', 'd75f5f', // 160
//    'd75f87', 'd75faf', 'd75fd7', 'd75fff', 'd78700', 'd7875f', 'd78787', 'd787af', // 168
//    'd787d7', 'd787ff', 'd7af00', 'd7af5f', 'd7af87', 'd7afaf', 'd7afd7', 'd7afff', // 176
//    'd7d700', 'd7d75f', 'd7d787', 'd7d7af', 'd7d7d7', 'd7d7ff', 'd7ff00', 'd7ff5f', // 184
//    'd7ff87', 'd7ffaf', 'd7ffd7', 'd7ffff', 'ff0000', 'ff005f', 'ff0087', 'ff00af', // 192
//    'ff00d7', 'ff00ff', 'ff5f00', 'ff5f5f', 'ff5f87', 'ff5faf', 'ff5fd7', 'ff5fff', // 200
//    'ff8700', 'ff875f', 'ff8787', 'ff87af', 'ff87d7', 'ff87ff', 'ffaf00', 'ffaf5f', // 208
//    'ffaf87', 'ffafaf', 'ffafd7', 'ffafff', 'ffd700', 'ffd75f', 'ffd787', 'ffd7af', // 216
//    'ffd7d7', 'ffd7ff', 'ffff00', 'ffff5f', 'ffff87', 'ffffaf', 'ffffd7', 'ffffff', // 224
//    '080808', '121212', '1c1c1c', '262626', '303030', '3a3a3a', '444444', '4e4e4e', // 232
//    '585858', '626262', '6c6c6c', '767676', '808080', '8a8a8a', '949494', '9e9e9e', // 240
//    'a8a8a8', 'b2b2b2', 'bcbcbc', 'c6c6c6', 'd0d0d0', 'dadada', 'e4e4e4', 'eeeeee'  // 248
//]


//var rgbs = exports.rgbs = [];
//var indexes = [];

var term;
var setup = exports.setup = function(t) {
    term = t;
}

//    rgbs = _.map( hexCodes, function( hex ) {
//	r = parseInt( hex.substr(0,2), 16 );
//	g = parseInt( hex.substr(2,2), 16 );
//	b = parseInt( hex.substr(4,2), 16 );
//	return [r,g,b];
//    });
//    
//    indexes = _.map( rgbs, function(hesx, i) {
//	return i;
//    });
//    
//    indexes = _.select( indexes, function(i) { return i < nc.maxColorPairs } );
//    _.each( indexes, function(i) { nc.colorPair(i,i,0) } );
//}

//var closestColorNoCache = function(r, g, b) {
//    return _.min( indexes, function( i ) { 
//	var rgb = rgbs[i];
//	var dr = r - rgb[0];
//	var dg = g - rgb[1];
//	var db = b - rgb[2];
//	
//	var rr = dr*dr + dg*dg + db*db;
//		
//	return rr;
//    });
//}

function toHexPair(d) {
    var result = d.toString(16);
    while(result.length < 2) {
	result = "0" + result;
    }
    return result;
}

var closestColorIndex = exports.closestColorIndex = function(r,g,b) {
    if( _.isArray(r) ) {
	b = r[2];
	g = r[1];
	r = r[0];
    }
    
    r = toHexPair( Math.floor( r * 255 ) );
    g = toHexPair( Math.floor( g * 255 ) );
    b = toHexPair( Math.floor( b * 255 ) );

    var key = "(#" + r + g + b + ")";
    
    var result = colorCache.get(key)
    if( !result ) {
	result = term._parseColor(key ).style;	
	colorCache.set(key,result);
    }
    return result; 
}

var addColors = exports.addColors = function( color1, color2 ) {
    var res = [ color1[0] + color2[0],color1[1] + color2[1],color1[2] + color2[2] ];
    return res;
}

var normalizeColor = exports.normalizeColor = function(res) {
    var max = _.max(res) || 1;
    if(max > 1) {
	res[0] = (res[0]||0) / max;
	res[1] = (res[1]||0) / max;
	res[2] = (res[2]||0) / max;
    }
    return res;
}

var normalizeLight = exports.normalizeLight = function(res) {
    var max = _.max(res);
    if(max > 0) {
	res[0] = (res[0]||0) / max;
	res[1] = (res[1]||0) / max;
	res[2] = (res[2]||0) / max;
    }
    return res;
}


var colorMask = exports.colorMask = function( color, mask ) {
    if( !mask || mask == 1)
	return color;
    return [ color[0] * mask[0], color[1] * mask[1], color[2] * mask[2] ]
}

exports.collectColorValues = function( color, colorw, aggregate ) {
    if( !aggregate )
	aggregate = { c: [0,0,0], s: 0.0 };

    if( colorw == 0 )
	return aggregate;

    aggregate.c[0] += color[0] * colorw;    
    aggregate.c[1] += color[1] * colorw;
    aggregate.c[2] += color[2] * colorw;
    aggregate.s += colorw;

    return aggregate;
}

exports.averageColorIndex = function( aggregate ) {    
    if(!aggregate || aggregate.s == 0 || _.isNaN(aggregate.s)) {
	return 7;
    }

    var c = [ aggregate.c[0] / aggregate.s, aggregate.c[1] / aggregate.s, aggregate.c[2]/ aggregate.s ];
    
    return closestColorIndex( c );
}

var black = [0,0,0];
exports.averageColor = function( aggregate ) {    
    if(!aggregate || aggregate.s == 0 || _.isNaN(aggregate.s)) {
	return black;
    }
    return [ aggregate.c[0] / aggregate.s, aggregate.c[1] / aggregate.s, aggregate.c[2]/ aggregate.s ];
}

exports.isCompatible = function( c1, c2 ) {
    if( _.isArray(c1 ) ) {
	return _.isArray(c2) && 
	    c1[0] == c2[0] && 
	    c1[1] == c2[1] && 
	    c1[2] == c2[2];
    } else {
	return c1 == c2;
    }
}