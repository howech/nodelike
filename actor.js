var xforms = require('./xforms');

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
    },
    attempt_move: function(dx,dy) {
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
		target_cell.enter( this );  // target cell will call setPosition...
	}
    },
    setPosition: function(x,y) {
	this.position = [x,y];
    },
    symbol: '@'
};

var Lantern = exports.Lantern = function() {
    this.on = false;
    this.angle = 0;
    this.aperture = 1;
}

exports.Lantern.prototype = {
    toggle: function() { this.on = !this.on },
    right: function() { 
	this.angle += this.aperture / 2.0;
	if(this.angle > Math.PI)
	    this.angle -= 2*Math.PI
    },
    left: function() {
	this.angle -= this.aperture / 2.0;
	if(this.angle < -Math.PI)
	    this.angle += 2*Math.PI
    },
    increase_aperture: function() {
	this.aperture = this.aperture * 2.0;
	if(this.aperture > 1)
	    this.aperture = 1;
    },
    decrease_aperture: function() {
	this.aperture = this.aperture / 2.0;
	if(this.aperture < 0.001)
	    this.aperture = 0.001;
    }
}

var Actor = exports.Actor = function(map) { 
    this.position = [-1,-1];
    this.map = map;
    this.lantern = new Lantern();
    this.tform = 0;
};
exports.Actor.prototype = actorPrototype;

