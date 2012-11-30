var _ = require('./underscore');

var Window = exports.Window = function(height, width, term) {
    this.row = 0;
    this.col = 0;
    this.height = height || 24;
    this.width = width || 80;
    this.term = term;
    this.border = false;
    this.label = null;
    this.initialize();
    this.borderChars = [ "-", "|", "+", "+", "+", "+" ];
    this.borderStyle = 0;
};

exports.Window.prototype = {
    initialize: function() {
	this.charBuffer = [];
	this.styleBuffer = [];
	for( var row = 0; row < this.height; ++row ) {
	    this.charBuffer[row] = [];
	    this.styleBuffer[row] = [];
	}
	this.erase();
    },
    erase: function() {
	for( var row = 0; row < this.height; ++row ) {
	    for(var col = 0; col < this.width; ++col ) {
		this.charBuffer[row][col] = 0;
		this.styleBuffer[row][col] = 0;
	    }
	}
    },
    set: function(row,col,chr,style) {
	if( _.isString( chr ) )
	    chr = chr.charCodeAt(0);

	if( row < this.height && row >= 0 && col < this.width && col >= 0 ) {
	    this.charBuffer[row][col] = chr;
	    this.styleBuffer[row][col] = style;
	}
    },
    set: function(row,col,chr,style) {
	if( _.isString( chr ) )
	    chr = chr.charCodeAt(0);

	if( row < this.height && row >= 0 && col < this.width && col >= 0 ) {
	    this.charBuffer[row][col] = chr;
	    this.styleBuffer[row][col] = style;
	}
    },
    setStyle: function(row,col,style) {
	if( row < this.height && row >= 0 && col < this.width && col >= 0 ) {
	    this.styleBuffer[row][col] = style;
	}
    },
    typeAt: function(row,col,string,style) {
	if( row < this.height && row >= 0 && col < this.width && col >= 0 ) {
	    for(var i = 0; i< string.length && col < this.width; ++i,++col) {
		this.charBuffer[row][col] = string.charCodeAt(i);
		this.styleBuffer[row][col] = style;
	    }
	}	
    },
    refresh: function() {
	var term = this.term;

	if( this.border ) {
	    var bottom = this.height-1;
	    var right = this.width-1;
	    var i;
	    for(i=1; i<right; ++i ) {
		this.charBuffer[0][i] = this.charBuffer[bottom][i] = this.borderChars[0].charCodeAt(0);
	    }
	    for(i=1; i<bottom; ++i ) {
		this.charBuffer[i][0] = this.charBuffer[i][right] = this.borderChars[1].charCodeAt(0);
	    }
	    this.charBuffer[0][0] = this.borderChars[2].charCodeAt(0);
	    this.charBuffer[0][right] = this.borderChars[3].charCodeAt(0);
	    this.charBuffer[bottom][0] = this.borderChars[4].charCodeAt(0);
	    this.charBuffer[bottom][right] = this.borderChars[5].charCodeAt(0);
	}

	for(var i=0, row=this.row; i<this.height && row<term.maxLines; ++i, ++row) {
	    for(var j=0,col=this.col; j<this.width && col<term.maxCols; ++j, ++col) {
		term.charBuf[row][col] = this.charBuffer[i][j
];
		term.styleBuf[row][col] = this.styleBuffer[i][j];
	    }
	    term.redraw( row );
	}
    },
    getStyleFromColor: function(color) {
	return term._parseColor( "(" + color + ")" ).style;
    }
}

