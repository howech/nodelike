var _ = require('underscore');
var xforms = require('./xforms');

var Memory = exports.Memory = function() {
    this.clear();
};

exports.Memory.prototype = {
    move: function(dx,dy) {
	this.position = xforms.transform( [dx,dy], 0, this.position );
    },
    transform: function(t) {
	this.tform = xforms.xtable[this.tform][t];
	this.itform = xforms.inverse[ this.tform ];	
    },
    key: function(x) {
	var y = xforms.transform(x,this.tform, this.position);
	return y;
//return y[0]+" "+y[1];
    },
    imprint: function(x, display ) {
	var key = this.key(x);
	var s = this.memory[key[1]];
	if( !s )
	    s = this.memory[ key[1] ] = [];
	s[key[0]] = display;
    },
    recall: function(x) {
	var key = this.key(x);
	var s = this.memory[key[1]]; 
	return s && s[key[0]];
    },
    clear: function() {
	this.position = [0,0];
	this.tform = 0;
	this.itform = 0;
	this.memory = [];
    }	
}
