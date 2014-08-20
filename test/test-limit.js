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
	it('should have an array to put fields into', function() {
		qb.should.have.property('limitTo');
	});
	it('should have an empty array to put fields into at the beginning', function() {
		qb.limitTo.should.be.false;
	});
	it('should require an integer (or integer in string form) in first parameter', function() {
		qb.resetQuery();
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
		qb.resetQuery();
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
	it('should override the default limitTo value when a limit is provided', function() {
		qb.resetQuery();
		qb.limit(10);
		qb.limitTo.should.eql(10);
	});
	it('should override the default limitTo and offsetVal values when a limit and an offset are provided', function() {
		qb.resetQuery();
		qb.limit(10,20);
		qb.limitTo.should.eql(10);
		qb.offsetVal.should.eql(20);
	});
	it('should trim string values that are provided', function() {
		qb.resetQuery();
		qb.limit('10    ');
		qb.limitTo.should.eql(10);
	});
	it('should trim string values that are provided', function() {
		qb.resetQuery();
		qb.limit('   10   ','    12');
		qb.limitTo.should.eql(10);
		qb.offsetVal.should.eql(12);
	});
	it('should override values set by any previous calls to itself', function() {
		qb.resetQuery();
		qb.limit(10);
		qb.limitTo.should.eql(10);
		qb.limit(20);
		qb.limitTo.should.eql(20);
	});
	it('should be chainable whereby the last call to the method will contain the value(s) used', function() {
		qb.resetQuery();
		qb.limit(10,5).limit(20).limit(100,30);
		qb.limitTo.should.eql(100);
		qb.offsetVal.should.eql(30);
	});
});