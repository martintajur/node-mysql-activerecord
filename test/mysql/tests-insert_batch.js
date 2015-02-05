var should = require('chai').should();
var expect = require('chai').expect;
var qb = require('../../drivers/mysql/query_builder.js').QueryBuilder();

var test_where = {id:3};
var test_data = [{id:3, name:'Milky Way', type: 'spiral'}, {id:4, name: 'Andromeda', type: 'spiral'}];

describe('insert_batch()', function() {
	it('should exist', function() {
		should.exist(qb.insert_batch);
	});
	it('should be a function', function() {
		qb.insert_batch.should.be.a('function');
	});
	it('should add a table to from_array when a table is supplied', function() {
		qb.reset_query();
		qb.insert_batch('galaxies', test_data);
		qb.from_array.should.eql(['`galaxies`']);
	});
	it('should only accept nothing or a string for the table (first) parameter', function() {
		qb.reset_query();
		
		// Doing these to prevent other errors
		qb.from('galaxies'); 
		
		expect(function() { qb.insert_batch([], test_data); 		}, 'empty array provided').to.throw(Error);
		expect(function() { qb.insert_batch({}, test_data); 		}, 'empty object provided').to.throw(Error);
		expect(function() { qb.insert_batch(3, test_data); 			}, 'integer provided').to.throw(Error);
		expect(function() { qb.insert_batch(3.5, test_data); 		}, 'float provided').to.throw(Error);
		expect(function() { qb.insert_batch(true, test_data); 		}, 'true provided').to.throw(Error);
		expect(function() { qb.insert_batch(Infinity, test_data);	}, 'Infinity provided').to.throw(Error);
		expect(function() { qb.insert_batch([1,2], test_data); 		}, 'array of numbers provided').to.throw(Error);
		expect(function() { qb.insert_batch(/foobar/, test_data);	}, 'regex provided').to.throw(Error);
		
		expect(function() { qb.insert_batch(NaN, test_data); 		}, 'NaN provided').to.not.throw(Error);
		expect(function() { qb.insert_batch(false, test_data); 		}, 'false provided').to.not.throw(Error);
		expect(function() { qb.insert_batch('', test_data); 		}, 'empty string provided').to.not.throw(Error);
		expect(function() { qb.insert_batch('  ', test_data); 		}, 'string full of spaces provided').to.not.throw(Error);
		expect(function() { qb.insert_batch(null, test_data); 		}, 'null provided').to.not.throw(Error);
		expect(function() { qb.insert_batch(undefined, test_data);	}, 'undefined provided').to.not.throw(Error);
	});
	it('should build a proper batch INSERT string', function() {
		qb.reset_query();
		var sql = qb.insert_batch('galaxies', test_data);
		sql.should.eql("INSERT INTO `galaxies` (`id`, `name`, `type`) VALUES (3, 'Milky Way', 'spiral'), (4, 'Andromeda', 'spiral')");
	});
	it('should only accept an array as the second parameter', function() {
		qb.reset_query();
		
		expect(function() { qb.insert_batch('galaxies',test_data);	}, 'array of objects provided').to.not.throw(Error);
		expect(function() { qb.insert_batch('galaxies',[]); 		}, 'empty array provided').to.not.throw(Error);
		
		expect(function() { qb.insert_batch('galaxies',[{},{}]); 	}, 'array of empty objects provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',[test_data,test_data]); }, 'array of arrays provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',{}); 		}, 'empty object provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',''); 		}, 'empty string provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',null); 		}, 'null provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',undefined);	}, 'undefined provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies');			}, 'nothing provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',3); 			}, 'integer provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',3.5); 		}, 'float provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',true); 		}, 'true provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',Infinity);	}, 'Infinity provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',[1,2]); 		}, 'array of numbers provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',[Date, /foobar/, null]); }, 'array of non-standard objects provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',['abc',2,{foo:'bar'}]); }, 'array of mixed values provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',/foobar/);	}, 'regex provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',NaN); 		}, 'NaN provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',false); 		}, 'false provided').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies','  '); 		}, 'string full of spaces provided').to.throw(Error);
	});
	it('should allow for an empty data parameter', function() {
		qb.reset_query();
		var sql = qb.insert_batch('galaxies',[]);
		sql.should.eql("INSERT INTO `galaxies` () VALUES ()");
	});
	it('should utilize pre-existing tables set in from_array', function() {
		qb.reset_query();
		qb.from('galaxies');
		var sql = qb.insert_batch(null,[]);
		sql.should.eql("INSERT INTO `galaxies` () VALUES ()");
	});
	it('should fail if any invalid values are passed into one of the data objects in the dataset', function() {
		qb.reset_query();
		var func = function() { console.log("foo"); };
		var regex = /foobar/;
		var arr = [1,2,3];
		var obj = {foo: 'bar'};
		
		expect(function() { qb.insert_batch('galaxies',[{id: func}]); 		}, 'function in data').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',[{id: regex}]); 		}, 'regex in data').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',[{id: Infinity}]);	}, 'Infinity in data').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',[{id: undefined}]);	}, 'undefined in data').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',[{id: NaN}]);		}, 'NaN in data').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',[{id: arr}]);		}, 'array in data').to.throw(Error);
		expect(function() { qb.insert_batch('galaxies',[{id: obj}]);		}, 'object in data').to.throw(Error);
	});
	it('should support insert ignore statements', function() {
		qb.reset_query();
		var sql = qb.insert_batch('galaxies', test_data, true, 'ON DUPLICATE KEY UPDATE last_update = NOW()');
		sql.should.eql("INSERT IGNORE INTO `galaxies` (`id`, `name`, `type`) VALUES (3, 'Milky Way', 'spiral'), (4, 'Andromeda', 'spiral') ON DUPLICATE KEY UPDATE last_update = NOW()");
	});
});