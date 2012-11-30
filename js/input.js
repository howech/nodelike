var nc;// = require('ncurses');
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
    'p': 'actor.makePortal',
    'z': 'enterLookMode',
    't': 'enterTargetMode',
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

var targetMode_keymap = {
    'k': 'view.move_n',
    'j': 'view.move_s',
    'h': 'view.move_w',
    'l': 'view.move_e',
    'y': 'view.move_nw',
    'u': 'view.move_ne',
    'b': 'view.move_sw',
    'n': 'view.move_se',
    'f': 'actor.fire',
    'z': 'exitTargetMode'
}

var keymap = playMode_keymap;

var Input = exports.Input = function(term,actor,map, view, update, quit, win) {
    this.term = term;
    this.actor = actor;
    this.map = map;
    this.update = update;
    this.quit = quit;
    this.keymap = playMode_keymap;
    this.view = view;
    this.window = win;
    this.mode = "Play";
    this.updateWindow();
}

exports.Input.prototype = {
    updateWindow: function() {
	this.window.erase();
	this.window.label = " " + this.mode + " Mode Commands ";
	var row = 1;
	_.each( this.keymap, function(f,k) {
	    this.window.typeAt(row, 2, k + ": " + f );
	    row++;
	}, this);
	
	this.window.refresh();
    },
    onInput: function() {
	var charStr = String.fromCharCode(this.term.inputChar);
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
		obj = obj[name].call( obj );
	    } else if(_.isObject( obj[name] )) {
		obj = obj[name];
	    } else { 
		args = [];
	    }
	}

	this.update();
    },
    enterLookMode: function() {
	this.mode = "Look";
	this.keymap = lookMode_keymap; 
	this.view.enterLookMode( this );
	this.updateWindow();
    },
    enterPlayMode: function() {
	this.mode = "Play";
	this.keymap = playMode_keymap; 
	this.updateWindow();
    },	
    exitLookMode: function() {
	this.view.exitLookMode();
	this.enterPlayMode();
    },
    enterTargetMode: function() {
	this.mode = "Target";
	this.keymap = targetMode_keymap; 
	this.view.enterTargetMode( this );
	this.updateWindow();
    },
    exitTargetMode: function() {
	this.view.exitTargetMode();
	this.enterPlayMode();
    }

}    
   
   