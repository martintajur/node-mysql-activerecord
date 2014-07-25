var should = require('chai').should();
var expect = require('chai').expect;

var QueryBuilder = require('../lib/query_builder.js');
var qb = new QueryBuilder();

describe('join()', function() {
	it('should exist', function() {
		should.exist(qb.join);
	});
	it('should be a function', function() {
		qb.join.should.be.a('function');
	});
	it('should have an array to put fields into', function() {
		qb.should.have.property('joinArray');
	});
	it('should have an empty array to put fields into at the beginning', function() {
		qb.joinArray.should.be.empty;
	});
	it('should require a string to be passed as first parameter', function() {
		var invalid_match = /must provide a table/;
		expect(function() { qb.join(); 		}, 'nothing provided').to.throw(Error, invalid_match);
		expect(function() { qb.join(true); 	}, 'true provided').to.throw(Error, invalid_match);
		expect(function() { qb.join(null); 	}, 'null provided').to.throw(Error, invalid_match);
		expect(function() { qb.join(false);	}, 'false provided').to.throw(Error, invalid_match);
		expect(function() { qb.join({}); 	}, 'object provided').to.throw(Error, invalid_match);
		expect(function() { qb.join([]); 	}, 'empty array provided').to.throw(Error, invalid_match);
		expect(function() { qb.join('');	}, 'empty string provided').to.throw(Error, invalid_match);
		expect(function() { qb.join('  ');	}, 'string of spaces provided').to.throw(Error, invalid_match);
		expect(function() { qb.join('blah');}, 'valid string provided').to.not.throw(Error);
		expect(function() { qb.join('blah');}, 'valid string provided').to.not.throw(Error);
	})
	it('should except single item and add it to join array as basic join and escape item', function() {
		qb.resetQuery();
		qb.join('universe');
		qb.joinArray.should.eql(['JOIN `universe` ']);
	});
	it('should except single item with alias and add it to join array as basic join and escape each part', function() {
		qb.resetQuery();
		qb.join('universe u');
		qb.joinArray.should.eql(['JOIN `universe` `u` ']);
	});
});