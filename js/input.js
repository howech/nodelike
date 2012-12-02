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

    '8': 'actor.move_n',
    '2': 'actor.move_s',
    '4': 'actor.move_w',
    '6': 'actor.move_e',
    '7': 'actor.move_nw',
    '9': 'actor.move_ne',
    '1': 'actor.move_sw',
    '3': 'actor.move_se',

    'up': 'actor.move_n',
    'down': 'actor.move_s',
    'left': 'actor.move_w',
    'right': 'actor.move_e',

    '|': 'actor.lantern.decrease_aperture',
    '\\': 'actor.lantern.increase_aperture',
    '-': 'actor.lantern.toggle',
    '{': 'actor.lantern.left',
    "}": 'actor.lantern.right',

    '[': 'actor.turn_left',
    ']': 'actor.turn_right',
    '=': 'actor.move_n',

    'p': 'actor.make_portal',
    'z': 'look_mode',
    't': 'target_mode',
    'a': 'activate_mode',
    ',': 'actor.pick_up',
    'd': 'actor.drop'
};

var activateMode_keymap = {
    'k': 'view.select_n',
    'j': 'view.select_s',
    'h': 'view.select_w',
    'l': 'view.select_e',
    'y': 'view.select_nw',
    'u': 'view.select_ne',
    'b': 'view.select_sw',
    'n': 'view.select_se',

    '8': 'view.select_n',
    '2': 'view.select_s',
    '4': 'view.select_w',
    '6': 'view.select_e',
    '7': 'view.select_nw',
    '9': 'view.select_ne',
    '1': 'view.select_sw',
    '3': 'view.select_se',

    '5': 'view.select_center',
    'space': 'view.select_center',
    '.': 'view.select_center',

    'up': 'view.select_n',
    'down': 'view.select_s',
    'left': 'view.select_w',
    'right': 'view.select_e',
    'z': 'cancel'
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
    'z': 'exit_look_mode',

    '8': 'view.move_n',
    '2': 'view.move_s',
    '4': 'view.move_w',
    '6': 'view.move_e',
    '7': 'view.move_nw',
    '9': 'view.move_ne',
    '1': 'view.move_sw',
    '3': 'view.move_se',

    'up': 'view.move_n',
    'down': 'view.move_s',
    'left': 'view.move_w',
    'right': 'view.move_e'
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
    'f': 'fire',
    'z': 'exit_target_mode',
    '8': 'view.move_n',
    '2': 'view.move_s',
    '4': 'view.move_w',
    '6': 'view.move_e',
    '7': 'view.move_nw',
    '9': 'view.move_ne',
    '1': 'view.move_sw',
    '3': 'view.move_se',

    'up': 'view.move_n',
    'down': 'view.move_s',
    'left': 'view.move_w',
    'right': 'view.move_e',
}

var keymap = playMode_keymap;

var Input = exports.Input = function(term,actor,map, view, update, quit, win, textWin) {
    this.term = term;
    this.actor = actor;
    this.map = map;
    this.update = update;
    this.quit = quit;
    this.keymap = playMode_keymap;
    this.view = view;
    this.window = win;
    this.textWin = textWin;
    this.mode = "Play";
    this.updateWindow();
}

var keyCodes = {
    "28": "left",
    "29": "right",
    "30": "up",
    "31": "down",
    "13": "enter",
    "9": "tab",
    "8": "backspace",
    "127": "del",
    "27": "escape",
    "32": "space"
}
 
var capitalize = function(str) {
    return str.replace(/_/g,' ').replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

exports.Input.prototype = {
    updateWindow: function() {
	this.window.erase();
	this.window.label = " " + this.mode + " Mode Commands ";
	var self = this;
 


	var command_tree = {};
	var raw = {};

	_.each( this.keymap, function(f,k) {
	    if( k == "_handler" )
		return;

	    if( _.isString(f) ) {
		var args = f.split('.');
		var obj = command_tree;
		while(args.length > 0) {
		    var name = args.shift();
		    if( args.length == 0 ) {
			obj[name] = obj[name] || [];
			obj[name].push(k);
		    } else {
			obj[name] = obj[name] || {};
			obj = obj[name];
		    }
		}
	    } else {
		raw[k] = f.description || f.getDescription(0);
	    }
	});

	var print_tree = function( tree, row, col ) {
	    var leaves = [];
	    var subtrees = [];
	    _.each( tree, function(sub,name) { 
		if( _.isArray(sub) ) {
		    leaves.push(name);
		} else {
		    subtrees.push(name);
		}		      
	    });
	    
	    leaves = leaves.sort();
	    _.each( leaves, function( command ) {
		self.window.typeAt( row, col+2, capitalize(command) + ": " + tree[command].sort().join(" ") );
		row++;
	    });
	    _.each( subtrees, function(tname) {
		self.window.typeAt( row, col, capitalize(tname) + " Commands" );
		row++;
		print_tree( tree[tname], row, col );
	    });
	}

	var row = 1;
	_.each( raw, function(d,k) {
	    self.window.typeAt( row++, 2, k + ": " +  d );
	});
	print_tree( command_tree, row, 2);	
	this.window.refresh();
    },
    onInput: function() {
	var charStr = keyCodes[this.term.inputChar] || String.fromCharCode(this.term.inputChar);
	//this.win.addstr(33,0,"Input: '" + charStr + "' (" + charCode + ") - isKey: " + isKey );

	var action = this.keymap[charStr];

	if( !action ) {
	    this.textWin.typeAt(1,1,"unknown key pressed: " + charStr + "   (" + this.term.inputChar + ")" );
	    this.update();
	    return;
	}

	if( _.isString( action ) ) {
	    var args = action.split('.');
	    var obj = this;
	    while(args.length > 0) {
		var name = args.shift();
		
		if( _.isFunction( obj[ name ] )) {
		    obj = obj[name].call( obj, this );
		} else if(_.isObject( obj[name] )) {
		    obj = obj[name];
		} else { 
		    args = [];
		}
	    }
	} else {
	    if( _.isFunction( this.keymap._handler )) {
		this.keymap._handler.call( this, action );
	    }
	}

	this.update();
    },
    look_mode: function() {
	this.mode = "Look";
	this.keymap = lookMode_keymap; 
	this.view.enterLookMode( this );
	this.updateWindow();
    },
    activate_mode: function() {
	this.mode = "Activate";
	this.keymap = activateMode_keymap;
	this.updateWindow();
    },
    enterPlayMode: function() {
	this.mode = "Play";
	this.keymap = playMode_keymap; 
	this.updateWindow();
    },	
    exit_look_mode: function() {
	this.view.exitLookMode();
	this.enterPlayMode();
    },
    target_mode: function() {
	this.mode = "Target";
	this.keymap = targetMode_keymap; 
	this.view.enterTargetMode( this );
	this.updateWindow();
    },
    exit_target_mode: function() {
	this.view.exitTargetMode();
	this.enterPlayMode();
    },
    fire: function() {
	var projectile = this.actor.make_portal();
	this.view.fire( projectile );
	this.view.exitTargetMode();
	this.enterPlayMode();
    },
    cancel: function() {
	this.enterPlayMode();
    },
    setSelectionKeymap: function( selection, keymap ) {
	this.selection = selection;
	this.keymap = _.extend( {}, keymap, 
				{ 'z': 'cancel',
				  'esc': 'cancel' } );
	this.updateWindow();
    },
}    
   
   