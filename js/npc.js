var _ = require("underscore");
var vision = require('./vision');
var xforms = require('./xforms');
var Creature = exports.Creature = function(container) {
    this.setup( container );
}

exports.Creature.prototype = {
    symbol: "c",
    holdable: false,
    isCreature: true,
    color: [.3,1,.3],
    description: "A creature",
    order: 0,
    range: 10,
    setup: function(container) {
	if(container) {
	    container.addContents(this);
	    this.position = [container.x, container.y];
	    this.map = this.container.map;
	}
	this.tform = 0;
    },
    turn_left: function()  { this.transform(4); },
    turn_right: function() { this.transform(5); },
    transform: function(t) {
	this.tform = xforms.xtable[this.tform][t];
	_.each( this.contents, function(item) {
	    if( _.isFunction(item.transform) ) {
		item.transform(t);
	    }
	});
    },
    attempt_move: function(dx,dy) {
	this.last_move = [dx,dy];
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
	this.position = [x,y];
    },
    
    take_turn: function() {
	if( this.awake && this.container && this.container.map ) {
	    vision.creatureVision( this, this.container.map );
	    this.move_towards_target();
	}
    },
    move_towards_target: function() {
	if(!this.target) {
	    this.awake = false;
	} else {
	    var dx=0, dy=0;
	    if( this.target[0] > 0)
		dx = 1;
	    else if( this.target[0] < 0)
		dx = -1;
	    if( this.target[1] > 0)
		dy = 1;
	    else if( this.target[1] < 0)
		dy = -1;

	    if(dx==0 && dy==0) {
		this.target = null;
	    } else {
		this.attempt_move( dx, dy );
	    }
	}
    },
    wake_up: function(range) {
	if( range < 10 )
	    this.awake = true;
    }
};