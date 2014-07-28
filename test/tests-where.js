var should = require('chai').should();
var expect = require('chai').expect;
var QueryBuilder = require('../lib/query_builder.js');
var qb = new QueryBuilder();

describe('where()', function() {
	it('should exist', function() {
		should.exist(qb.where);
	});
	it('should be a function', function() {
		qb.where.should.be.a('function');
	});
});