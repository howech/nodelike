var xforms = require('./xforms');
var intervals = require('./intervals');
var portal = require('./portal');
var memory = require('./memory');
var _ = require('underscore');

var actorPrototype = {
    move_n: function()  { this.attempt_move( 0,-1); },
    move_s: function()  { this.attempt_move( 0, 1); },
    move_w: function()  { this.attempt_move(-1, 0); },
    move_e: function()  { this.attempt_move( 1, 0); },
    move_nw: function() { this.attempt_move(-1,-1); },
    move_ne: function() { this.attempt_move( 1,-1); },
    move_sw: function() { this.attempt_move(-1, 1); },
    move_se: function() { this.attempt_move( 1, 1); },
    turn_left: function()  { this.transform(4); },
    turn_right: function() { this.transform(5); },
    transform: function(t) {
	this.tform = xforms.xtable[this.tform][t];
	this.memory.transform(t);
	_.each( this.contents, function(item) {
	    if( _.isFunction(item.transform) ) {
		item.transform(t);
	    }
	});
    },
    attempt_move: function(dx,dy) {
	// check for moving diagonally through through blocking elements
	if(dx != 0 && dy != 0 ) {
	    var a = xforms.transform( [dx,0], this.tform, this.position );
	    var ta = this.map.getCell( a[0], a[1] );
	    if( !ta || ta.blocking ) {
		var b = xforms.transform( [0,dy], this.tform, this.position );
		var tb = this.map.getCell( b[0], b[1] );
		if(!tb || tb.blocking)
		    return;
	    }
	}

	var new_pos = xforms.transform( [dx,dy], this.tform, this.position );

	//var new_pos = [ this.position[0] +dx, this.position[1] +dy ];
	
	// Get the current and exiting cells.
	var current_cell = this.map.getCell( this.position[0], this.position[1] );
	var target_cell = this.map.getCell( new_pos[0], new_pos[1] );
	
	// if the requested cell is off the map, we might get
	// a null target cell back. In this case, we do nothing.
	if( target_cell ) {
	    current_cell.tryExit( this ) &&
		target_cell.tryEnter( this ) &&
		current_cell.exit( this ) &&
		target_cell.enter( this );
	}
    },
    setPosition: function(x,y) {
	if( this.position ) {
	    this.memory.move( -this.position[0], -this.position[1] )
	    this.memory.move(x,y);
	}
	this.position = [x,y];
    },
    make_portal: function() {
	var p = new portal.Portal( this.container, this);
	return p;
    },
    pick_up: function( input ) {
	var pickups = _.filter( this.container.contents, function(item) { return item.holdable } );
	
	var keymap = { z: "cancel",
		       _handler: function( item ) {
			   this.actor.take_item( item );
			   this.cancel();
		       }
		     };

	for(i=0;i<25 && i<pickups.length; ++i) {
	    keymap[ String.fromCharCode( 'a'.charCodeAt(0) + i ) ] = pickups[i];
	}
	
	input.setSelectionKeymap( null, keymap );
    },
    drop: function( input ) {
	var drops = _.filter( this.contents, function(item) { return item.holdable } );
	
	var keymap = { z: "cancel",
		       _handler: function( item ) {
			   this.actor.drop_item( item );
			   this.cancel();
		       }
		     };

	for(i=0;i<25 && i<drops.length; ++i) {
	    keymap[ String.fromCharCode( 'a'.charCodeAt(0) + i ) ] = drops[i];
	}
	
	input.setSelectionKeymap( null, keymap );
    },
    drop_item: function(item) {
	item.container.removeContents(item);
	this.container.addContents(item);
    },
    take_item: function( item ) {
	item.container.removeContents( item );
	this.addContents( item );
    },
    summarizeContents: function() {
    },
	    
    addContents: function( object ) {
	this.contents.push( object );
	object.container = this;
	this.summarizeContents();
    },
    removeContents: function( obj ) {
	this.contents = _.without( this.contents, obj );
	obj.container = null;
	this.summarizeContents();
    },

    symbol: '@'
};

var Lantern = exports.Lantern = function() {
    this.on = false;
    this.angle = 0;
    this.aperture = 1;
    this.interval = [-1,1];
}

exports.Lantern.prototype = {
    toggle: function() { this.on = !this.on },
    right: function() { 
	this.angle += this.aperture / 2.0;
	if(this.angle > Math.PI)
	    this.angle -= 2*Math.PI
	this.updateInterval();
    },
    left: function() {
	this.angle -= this.aperture / 2.0;
	if(this.angle < -Math.PI)
	    this.angle += 2*Math.PI
	this.updateInterval();
    },
    increase_aperture: function() {
	this.aperture = this.aperture * 2.0;
	if(this.aperture > 1)
	    this.aperture = 1;
	this.updateInterval();
    },
    decrease_aperture: function() {
	this.aperture = this.aperture / 2.0;
	if(this.aperture < 0.001)
	    this.aperture = 0.001;
	this.updateInterval();
    },
    updateInterval: function() {
	this.interval = intervals.boundingInterval( this.angle - this.aperture, this.angle + this.aperture );
    }
}

var Actor = exports.Actor = function(map) { 
    this.position = [-1,-1];
    this.map = map;
    this.lantern = new Lantern();
    this.tform = 0;
    this.memory = new memory.Memory();
    this.order = -1;
    this.color = [1,1,1];
    this.contents = [];
};
exports.Actor.prototype = actorPrototype;

