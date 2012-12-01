var xforms = require('./xforms');
var _ = require('underscore');

var Portal = exports.Portal = function(cell,generator) {
    this.symbol = "*";
    this.color = [ .8,.6,1];
    if( generator.getLastPortal ) {
	generator.getLastPortal.target = this;
	this.target = generator.getLastPortal;
	generator.getLastPortal = null;
    } else {
	generator.getLastPortal = this;
    }
    this.exit_tform = generator.tform;
    this.enter_tform = xforms.inverse[ this.exit_tform ];

    cell.addContents( this );
    this.description = "A magical gateway to parts unknown.";
    this.rayProcessor = true;
    this.enterAction = true;
}

exports.Portal.prototype = _.extend(
    {},
    {
	gateWayTform: function(t) {
	    if( this.target ) {
		var limbo = xforms.xtable[t][this.enter_tform];
		var target_tform = this.target.exit_tform || 0;
		return xforms.xtable[limbo][target_tform];
	    } else {
		return 0;
	    }
	},
	processRaysIvs: function(job) {    
	    if( !this.target || !this.target.container ) {
		return [];
	    }

	    if( this.tint ) {
		job.c = colors.colorMask( this.tint, job.c );
	    }
	    
	    if( job.x[0] == 0 && job.x[1] == 0 ) {

		return [];
	    }

	    var cell = this.target.container;
	    var y = [cell.x, cell.y];
	    var t = this.gateWayTform( job.t );
	    	    
	    var d = xforms.transform( job.x, xforms.xtable[3][t], y );
	    var i = job.i;
	    job.i = []; // consume the rays from the job.

            return [ { i: i, t: t, d: d } ];
	},
	tryEnter: function( actor ) {
	    return true;
	},
	enter: function( actor ) {
	    if( !this.target || !this.target.container ) {
		return false;
	    }
	    var tcell = this.target.container;
	    tcell.addContents(actor);
	    actor.setPosition( tcell.x, tcell.y );
	    var v = this.gateWayTform( actor.tform );
	    actor.transform( xforms.xtable[ xforms.inverse[ actor.tform ] ][v]);
	    return true;
	}

    }
);    
