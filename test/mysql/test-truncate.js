var should = require('chai').should();
var expect = require('chai').expect;
var qb = require('../../drivers/mysql/query_builder.js').QueryBuilder();

describe('truncate()', function() {
	it('should exist', function() {
		should.exist(qb.truncate);
	});
	it('should be a function', function() {
		qb.truncate.should.be.a('function');
	});
	it('should return a string', function() {
		qb.reset_query();
		var sql = qb.truncate('galaxies');
		expect(sql).to.be.a('string');
		expect(sql).to.exist;
		expect(sql).to.not.eql('');
	});
	it('should build a proper truncate statement', function() {
		qb.reset_query();
		var sql = qb.truncate('galaxies');
		sql.should.eql('TRUNCATE `galaxies`');
	});
});