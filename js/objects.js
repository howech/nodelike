
var _ = require("underscore");

var Item = exports.Item = function(container) {    
    this.setup(container);
}

exports.Item.prototype = {
    symbol: '(',
    holdable: true,
    color: [.3,1,,3],
    description: "A thing.",
    order: 99,
    setup: function(container) {
	if(container)
	    container.addContents(this);
    }
};

var Candle = exports.Candle = function(container) {
    this.symbol = "'";
    this.setup(container);
    this.lightSource = true;
    this.description = "A candle.";
};

exports.Candle.prototype = _.extend(
    new Item(),
    {
	getLightSource: function() {
	    if( ! this.lightSourceObject )
		this.lightSourceObject = {
		    interval: [-Math.PI, Math.PI ],
		    tform: 0,
		    color: [0.8,0.8,0.5],
		    range: 10
		};
	    return this.lightSourceObject;
	},
	actions: function() {
	    if(this.lightSource) {
		return { b: "selection.blow_out" }
	    } else {
		return { l: "selection.light_candle" }
	    }
	},
	blow_out:  function(input) {
	    this.lightSource = false;
	    this.color = [.5,.5,.5];

	    if( this.container ) {
		this.container.summarizeContents();
	    }
	    this.description = "A candle. (dark)";

	    if( input )
		input.cancel();
	},
	light_candle:  function(input) {
	    this.lightSource = true;
	    this.color = [.8,.8,.5];

	    if( this.container ) {
		this.container.summarizeContents();
	    }
	    this.description = "A candle. (lit)";

	    if(input)
		input.cancel();
	}
    });
