const should = require('chai').should();
const expect = require('chai').expect;
const qb = require('../../drivers/mysql/query_builder.js').QueryBuilder();

describe('distinct()', function() {
	it('should exist', function() {
		should.exist(qb.distinct);
	});
	it('should be a function', function() {
		qb.distinct.should.be.a('function');
	});
	it('should override the default distinct_clause with the "DISTINCT " keyword', function() {
		qb.reset_query();
		qb.distinct();
		qb.distinct_clause.should.eql(['DISTINCT ']);
	});
});