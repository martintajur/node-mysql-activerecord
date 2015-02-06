var should = require('chai').should();
var expect = require('chai').expect;
var qb = require('../../drivers/mysql/query_builder.js').QueryBuilder();

describe('limit()', function() {
	it('should exist', function() {
		should.exist(qb.limit);
	});
	it('should be a function', function() {
		qb.limit.should.be.a('function');
	});
	it('should have an array to put fields into', function() {
		qb.should.have.property('limit_to');
	});
	it('should have an empty array to put fields into at the beginning', function() {
		qb.limit_to.should.be.empty;
	});
	it('should require an integer (or integer in string form) in first parameter', function() {
		qb.reset_query();
		expect(function() { qb.limit(5); 	}, 'integer provided').to.not.throw(Error);
		expect(function() { qb.limit('5'); 	}, '5 in string form provided').to.not.throw(Error);
		expect(function() { qb.limit(5.7); 	}, 'float provided').to.throw(Error);
		expect(function() { qb.limit('5.7');}, 'float provided').to.throw(Error);
		expect(function() { qb.limit('abc');}, 'alpha provided').to.throw(Error);
		expect(function() { qb.limit('abc7');}, 'alpha numerics provided').to.throw(Error);
		expect(function() { qb.limit(); 	}, 'nothing provided').to.throw(Error);
		expect(function() { qb.limit(null); }, 'null provided').to.throw(Error);
		expect(function() { qb.limit(true); }, 'true provided').to.throw(Error);
		expect(function() { qb.limit(false);}, 'false provided').to.throw(Error);
		expect(function() { qb.limit(''); 	}, 'empty string provided').to.throw(Error);
		expect(function() { qb.limit({}); 	}, 'empty object provided').to.throw(Error);
		expect(function() { qb.limit([]); 	}, 'empty array provided').to.throw(Error);
		expect(function() { qb.limit([5]); 	}, 'array with integer in it provided').to.throw(Error);
	});
	it('should allow an integer (or integer in string form) in second parameter. Nothing else is allowed.', function() {
		qb.reset_query();
		expect(function() { qb.limit(10,5); 	}, 'integer provided').to.not.throw(Error);
		expect(function() { qb.limit(10,'5'); 	}, '5 in string form provided').to.not.throw(Error);
		expect(function() { qb.limit(10,5.7); 	}, 'float provided').to.throw(Error);
		expect(function() { qb.limit(10,'5.7');	}, 'float provided').to.throw(Error);
		expect(function() { qb.limit(10,'abc');	}, 'alpha provided').to.throw(Error);
		expect(function() { qb.limit(10,'abc7');}, 'alphanumerics provided').to.throw(Error);
		expect(function() { qb.limit(10,null); 	}, 'null provided').to.throw(Error);
		expect(function() { qb.limit(10,true); 	}, 'true provided').to.throw(Error);
		expect(function() { qb.limit(10,false);	}, 'false provided').to.throw(Error);
		expect(function() { qb.limit(10,''); 	}, 'empty string provided').to.throw(Error);
		expect(function() { qb.limit(10,{}); 	}, 'empty object provided').to.throw(Error);
		expect(function() { qb.limit(10,[]); 	}, 'empty array provided').to.throw(Error);
		expect(function() { qb.limit(10,[5]); 	}, 'array with integer in it provided').to.throw(Error);
	});
	it('should override the default limit_to value when a limit is provided', function() {
		qb.reset_query();
		qb.limit(10);
		qb.limit_to.should.eql([10]);
	});
	it('should override the default limit_to and offset_val values when a limit and an offset are provided', function() {
		qb.reset_query();
		qb.limit(10,20);
		qb.limit_to.should.eql([10]);
		qb.offset_val.should.eql([20]);
	});
	it('should trim string values that are provided', function() {
		qb.reset_query();
		qb.limit('10    ');
		qb.limit_to.should.eql([10]);
	});
	it('should trim string values that are provided', function() {
		qb.reset_query();
		qb.limit('   10   ','    12');
		qb.limit_to.should.eql([10]);
		qb.offset_val.should.eql([12]);
	});
	it('should override values set by any previous calls to itself', function() {
		qb.reset_query();
		qb.limit(10);
		qb.limit_to.should.eql([10]);
		qb.limit(20);
		qb.limit_to.should.eql([20]);
	});
	it('should be chainable whereby the last call to the method will contain the value(s) used', function() {
		qb.reset_query();
		qb.limit(10,5).limit(20).limit(100,30);
		qb.limit_to.should.eql([100]);
		qb.offset_val.should.eql([30]);
	});
});