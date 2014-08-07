var should = require('chai').should();
var expect = require('chai').expect;
var QueryBuilder = require('../lib/query_builder.js');
var qb = new QueryBuilder();

describe('limit()', function() {
	it('should exist', function() {
		should.exist(qb.limit);
	});
	it('should be a function', function() {
		qb.limit.should.be.a('function');
	});
	it('should require an integer (or integer in string form) in first parameter', function() {
		qb.resetQuery();
		expect(function() { qb.limit(5); 	}, 'integer provided').to.not.throw(Error);
		expect(function() { qb.limit('5'); 	}, '5 in string form provided').to.not.throw(Error);
		expect(function() { qb.limit(5.7); 	}, 'float provided').to.throw(Error);
		expect(function() { qb.limit('5.7');}, 'float provided').to.throw(Error);
		expect(function() { qb.limit(); 	}, 'nothing provided').to.throw(Error);
		expect(function() { qb.limit(null); }, 'null provided').to.throw(Error);
		expect(function() { qb.limit(true); }, 'true provided').to.throw(Error);
		expect(function() { qb.limit(false);}, 'false provided').to.throw(Error);
		expect(function() { qb.limit(''); 	}, 'empty string provided').to.throw(Error);
		expect(function() { qb.limit({}); 	}, 'empty object provided').to.throw(Error);
		expect(function() { qb.limit([]); 	}, 'empty array provided').to.throw(Error);
		expect(function() { qb.limit([5]); 	}, 'array with integer in it provided').to.throw(Error);
	});
	it('should allow an integer (or integer in string form) in second parameter', function() {
		qb.resetQuery();
		expect(function() { qb.limit(10,5); 	}, 'integer provided').to.not.throw(Error);
		expect(function() { qb.limit(10,'5'); 	}, '5 in string form provided').to.not.throw(Error);
		expect(function() { qb.limit(10,5.7); 	}, 'float provided').to.throw(Error);
		expect(function() { qb.limit(10,'5.7');}, 'float provided').to.throw(Error);
		expect(function() { qb.limit(10,null); }, 'null provided').to.throw(Error);
		expect(function() { qb.limit(10,true); }, 'true provided').to.throw(Error);
		expect(function() { qb.limit(10,false);}, 'false provided').to.throw(Error);
		expect(function() { qb.limit(10,''); 	}, 'empty string provided').to.throw(Error);
		expect(function() { qb.limit(10,{}); 	}, 'empty object provided').to.throw(Error);
		expect(function() { qb.limit(10,[]); 	}, 'empty array provided').to.throw(Error);
		expect(function() { qb.limit(10,[5]); 	}, 'array with integer in it provided').to.throw(Error);
	});
});