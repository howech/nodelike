var nc = require('ncurses');
var _ = require('underscore');

var playMode_keymap = {
    'q': 'quit',
    'k': 'actor.move_n',
    'j': 'actor.move_s',
    'h': 'actor.move_w',
    'l': 'actor.move_e',
    'y': 'actor.move_nw',
    'u': 'actor.move_ne',
    'b': 'actor.move_sw',
    'n': 'actor.move_se',
    'd': 'actor.lantern.decrease_aperture',
    'e': 'actor.lantern.increase_aperture',
    'x': 'actor.lantern.toggle',
    'a': 'actor.lantern.left',
    's': 'actor.lantern.right',
    '[': 'actor.turn_left',
    ']': 'actor.turn_right',
    'z': 'enterLookMode'
}

var lookMode_keymap = {
    'k': 'view.move_n',
    'j': 'view.move_s',
    'h': 'view.move_w',
    'l': 'view.move_e',
    'y': 'view.move_nw',
    'u': 'view.move_ne',
    'b': 'view.move_sw',
    'n': 'view.move_se',
    'z': 'exitLookMode'
}

var keymap = playMode_keymap;

var Input = exports.Input = function(actor,map, view, update, quit) {
    this.actor = actor;
    this.map = map;
    this.update = update;
    this.quit = quit;
    this.keymap = keymap;
    this.view = view;
}

exports.Input.prototype = {
    onInput: function(charStr, charCode, isKey) {
	//this.win.addstr(33,0,"Input: '" + charStr + "' (" + charCode + ") - isKey: " + isKey );

	var action = this.keymap[charStr];

	if( !action ) {
	    this.update();
	    return;
	}

	var args = action.split('.');
	var obj = this;
	while(args.length > 0) {
	    var name = args.shift();
	    
	    if( _.isFunction( obj[ name ] )) {
		obj = obj[name]();
	    } else if(_.isObject( obj[name] )) {
		obj = obj[name];
	    } else { 
		args = [];
	    }
	}

	this.update();
    },
    enterLookMode: function() {
	this.keymap = lookMode_keymap; 
	this.view.enterLookMode( this );
    },
    exitLookMode: function() {
	this.keymap = playMode_keymap;
	this.view.exitLookMode();
    }
}    
   
   