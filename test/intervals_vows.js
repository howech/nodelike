var vows = require('vows');
var assert = require('assert');
var _ = require('underscore');

var intervals = require('../intervals');

vows.describe("Intervals functions").addBatch( {
    "boundingInterval" : {
	topic: { set1: [1,2,3],
		 set2: [3,3.1,-3,-3.1],
		 set3: [-1,-0.5,-0.25,0,.25,1],
		 set4: [ 1, 1, 1, 1 ]
	       },
	set1: function(topic) {
	    var x = intervals.boundingInterval( topic.set1 );
	    assert.equal( x[0], 1 );
	    assert.equal( x[1], 3 );
	    assert.equal( x.length, 2 );
	},
	set2: function(topic) {
	    var x = intervals.boundingInterval( topic.set2 );
	    assert.equal( x[0], -Math.PI );
	    assert.equal( x[1], -3 );
	    assert.equal( x[2], 3 );
	    assert.equal( x[3], Math.PI );
	    assert.equal( x.length, 4 );
	},
	set3: function(topic) {
	    var x = intervals.boundingInterval( topic.set3 );
	    assert.equal( x[0], -1 );
	    assert.equal( x[1], 1 );
	    assert.equal( x.length, 2 );
	},
	set4: function(topic) {
	    var x = intervals.boundingInterval( topic.set4 );
	    assert.deepEqual(x,[]);
	}

    },
    "invert": {
	topic: { one: [],
		 two: [-Math.PI, Math.PI],
		 three: [1,2],
		 four: [-Math.PI, 1, 2, Math.PI],
	       },
	one_two: function(topic) {
	    var x1 = intervals.invert( topic.one );
	    var x2 = intervals.invert( x1 );
	    var x3 = intervals.invert( topic.two );
	    var x4 = intervals.invert( x3 );

	    assert.deepEqual(x1, topic.two );
	    assert.deepEqual(x2, topic.one );
	    assert.deepEqual(x3, topic.one );
	    assert.deepEqual(x4, topic.two );
	},
	three_four: function(topic) {
	    var x1 = intervals.invert( topic.three );
	    var x2 = intervals.invert( x1 );
	    var x3 = intervals.invert( topic.four );
	    var x4 = intervals.invert( x3 );

	    assert.deepEqual(x1, topic.four );
	    assert.deepEqual(x2, topic.three );
	    assert.deepEqual(x3, topic.three );
	    assert.deepEqual(x4, topic.four );
	}
    },
    "normalize": {
	topic: { one: [],
		 two: [1,2,2,2],
		 three: [0,0,1,1,2,2,3,3],
		 four: [0,1.5,1.8,3]
	       },
	idempotent: function(topic) {
	    _.each(topic, function(iv) {
		var x1 = intervals.normalize(iv);
		var x2 = intervals.normalize(x1);
		assert.deepEqual( x1, x2 );
	    });
	},
	basics: function(topic) {
	    var results = {};
	    _.each(topic, function(iv,name) {
		results[name] = intervals.normalize( iv );
	    });

	    assert.deepEqual( results.one, [] );
	    assert.deepEqual( results.two, [1,2] );
	    assert.deepEqual( results.three, [] );
	    assert.deepEqual( results.four,  topic.four );
	}
	    
    },
    "intersection": {
	topic: { one: [],
		 two: [1,2],
		 three: [2,3],
		 four: [0,1.5,1.8,3]
	       },
	empty_set: function(topic) {
	    assert.deepEqual( intervals.intersection( topic.one, topic.one ), topic.one );
	    assert.deepEqual( intervals.intersection( topic.one, topic.two ), topic.one );
	    assert.deepEqual( intervals.intersection( topic.one, topic.three ), topic.one );
	    assert.deepEqual( intervals.intersection( topic.one, topic.four ), topic.one );
	    assert.deepEqual( intervals.intersection( topic.two, topic.one ), topic.one );
	    assert.deepEqual( intervals.intersection( topic.three, topic.one ), topic.one );
	    assert.deepEqual( intervals.intersection( topic.four, topic.one ), topic.one );
	},
	reflexive: function(topic) {
	    _.each( topic, function( iv ) {
		assert.deepEqual( intervals.intersection(iv,iv), iv );
	    });
	},
	non_overlap: function(topic) {
	    assert.deepEqual( intervals.intersection( topic.two, topic.three ), [] );
	    assert.deepEqual( intervals.intersection( topic.three, topic.two ), [] );
	},
	overlap: function(topic) {
	    assert.deepEqual( intervals.intersection( topic.two, topic.four ), [1,1.5,1.8,2] );
	    assert.deepEqual( intervals.intersection( topic.four, topic.two ), [1,1.5,1.8,2] );
	    assert.deepEqual( intervals.intersection( topic.three, topic.four ), [2,3] );
	    assert.deepEqual( intervals.intersection( topic.four, topic.three ), [2,3] );
	},
	
    },
    "union": {
	topic: { one: [],
		 two: [1,2],
		 three: [2,3],
		 four: [0,1.5,1.8,3]
	       },
	identity: function(topic) {
	    _.each(topic, function(iv) {
		assert.deepEqual( intervals.union([], iv), iv );
		assert.deepEqual( intervals.union(iv, []), iv );
		assert.deepEqual( intervals.union(iv, iv), iv );
	    });
	},
	basics: function(topic) {
	    assert.deepEqual( intervals.union( topic.two, topic.three ), [1,3] );
	    assert.deepEqual( intervals.union( topic.two, topic.four ), [0,3] );
	}
    },
    "difference": {
	topic: { one: [],
		 two: [1,2],
		 three: [2,3],
		 four: [0,1.5,1.8,3]
	       },
	identity: function(topic) {
	    _.each(topic, function(iv) {
		assert.deepEqual( intervals.difference([], iv), [] );
		assert.deepEqual( intervals.difference(iv, []), iv );
		assert.deepEqual( intervals.difference(iv, iv), [] );
	    });
	},
	basics: function(topic) {
	    assert.deepEqual( intervals.difference( topic.two, topic.three ), [1,2] );
	    assert.deepEqual( intervals.difference( topic.two, topic.four ), [1.5,1.8] );
	}
    },
    "measure": {
	topic: { one: [],
		 two: [1,2],
		 three: [2,3],
		 four: [0,1.5,1.8,3]
	       },
	measure: function(topic) {
	    var m = { one: 0, two: 1, three: 1,four: 1.5+3-1.8};
	    _.each(topic, function(iv,i) {
		assert.equal( intervals.measure(iv), m[i] );
	    });
	}
    },

}).export(module);