var cell = require('./cell');
var _ = require('underscore');
var vision = require('./vision');
var mapPrototype = {
    getCell: function(x,y) {
	if( _.isArray(x) ) {
	    y = x[1];
	    x = x[0];
	}

	// return null if the cell does not exits
	if( x<0 || x>= this.width ||
	    y<0 || y>= this.height )
	    return null;

	return this.map[y][x];
    },

    setCell: function(x,y,cell) {
	// return null if the cell does not exits
	if( x<0 || x>= this.width ||
	    y<0 || y>= this.height )
	    return null;
	
	var oldCell = this.map[y][x];
	this.map[y][x] = cell;
	cell.map = this;
	cell.x = x;
	cell.y = y;
	delete oldCell.map;

	return oldCell;
    },

    each: function( func ) {
	for(var i = 0; i< this.height; ++i) {
	    for(var j = 0; j< this.width; ++j) {
		func.call( this, this.map[i][j], j, i, this );
	    }
	}
    },

    clearVisible: function() {
	this.each( function(cell) { cell.clearVisible() } );
    },

    clearLight: function() {
	this.each( function(cell) { cell.clearLight(this.static_light) } );
	if( ! this.static_light ) {
	    this.each( function(cell) {
		if( cell.staticLightSource ) {
		    vision.light( cell.getStaticLightSource(), this );
		}
	    });
	    
	    this.each( function(cell) {
		cell.static_light = _.clone( cell.light );
	    });
	    this.static_light = true;
	};    
	   
    },
    getLightSources: function() {
	var results = [];
	this.each( function(cell) { 
	    if(cell.lightSource) {
		results.push( cell.getLightSource() );
	    }
	});
	return results;
    }		 		
};

exports.Map = function(width, height) {
    this.map = [];
    this.height = height;
    this.width = width;

    for(var i = 0; i< height; ++i) {
	this.map[i] = [];
	for(var j = 0; j<width; ++j) {
	    this.map[i][j] = new cell.EmptyCell();
	    this.map[i][j].x = j;
	    this.map[i][j].y = i;
	}
    }
};

exports.Map.prototype = mapPrototype;


