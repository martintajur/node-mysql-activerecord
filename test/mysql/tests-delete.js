var should = require('chai').should();
var expect = require('chai').expect;
var QueryBuilder = require('../../drivers/mysql/query_builder.js');
var qb = new QueryBuilder();

describe('delete()', function() {
	it('should exist', function() {
		should.exist(qb.delete);
	});
	it('should be a function', function() {
		qb.delete.should.be.a('function');
	});
	it('should add a table to from_array when a table is supplied', function() {
		qb.reset_query();
		qb.delete('galaxies');
		qb.from_array.should.eql(['`galaxies`']);
	});
	it('should add a set of tables to from_array when an array of tables is supplied', function() {
		qb.reset_query();
		qb.delete(['galaxies','star_systems','planets']);
		qb.from_array.should.eql(['`galaxies`','`star_systems`','`planets`']);
	});
	it('should add where conditions to where_array when conditions are supplied', function() {
		qb.reset_query();
		qb.delete('planets', {continents: 7, star_system: 'Solar'});
		qb.where_array.should.eql(["`continents` = 7", "AND `star_system` = 'Solar'"]);
	});
	it('should accept an array of tables and an object of where conditions and put each in their respective arrays', function() {
		qb.reset_query();
		qb.delete(['galaxies','star_systems','planets'], {continents: 7, star_system: 'Solar'});
		qb.from_array.should.eql(['`galaxies`','`star_systems`','`planets`']);
		qb.where_array.should.eql(["`continents` = 7", "AND `star_system` = 'Solar'"]);
	});
	it('should return a string', function() {
		qb.reset_query();
		var sql = qb.delete(['galaxies','star_systems','planets'], {continents: 7, star_system: 'Solar'});
		expect(sql).to.be.a('string');
		expect(sql).to.exist;
		expect(sql).to.not.eql('');
	});
	it('should build a properly-escaped delete statement that deletes all records in a table if only a table is given', function() {
		qb.reset_query();
		var sql = qb.delete('galaxies');
		sql.should.eql('DELETE FROM (`galaxies`)');
	});
	it('should build a properly-escaped delete statement that deletes all records in a table that matched passed conditions', function() {
		qb.reset_query();
		var sql = qb.delete('galaxies', {class: 'M'});
		sql.should.eql("DELETE FROM (`galaxies`) WHERE `class` = 'M'");
	});
	it('should build a properly-escaped delete statement that deletes all records in a set of tables if an array of tables is given', function() {
		qb.reset_query();
		var sql = qb.delete(['galaxies','star_systems','planets']);
		sql.should.eql('DELETE FROM (`galaxies`, `star_systems`, `planets`)');
	});
	it('should build a properly-escaped delete statement that deletes all records in a set of tables that match the passed conditions', function() {
		qb.reset_query();
		var sql = qb.delete(['galaxies','star_systems','planets'], {class: 'M'});
		sql.should.eql("DELETE FROM (`galaxies`, `star_systems`, `planets`) WHERE `class` = 'M'");
	});
	it('should use tables added previously via the from() method', function() {
		qb.reset_query();
		qb.from('galaxies');
		var sql = qb.delete();
		sql.should.eql('DELETE FROM (`galaxies`)');
		
		qb.reset_query();
		var sql = qb.from(['galaxies','star_systems','planets']).delete();
		sql.should.eql('DELETE FROM (`galaxies`, `star_systems`, `planets`)');
	});
	it('should accept where conditions added previously via the where() method', function() {
		qb.reset_query();
		var sql = qb.where('created >=',4.6E9).where({class: 'M'}).delete('galaxies');
		sql.should.eql("DELETE FROM (`galaxies`) WHERE `created` >= 4600000000 AND `class` = 'M'");
	});
	it('should accept a limit on the number of rows deleted', function() {
		qb.reset_query();
		var sql = qb.limit(20).delete('galaxies');
		sql.should.eql("DELETE FROM (`galaxies`) LIMIT 20");
	});
	it('should accept a LIMIT on the number of rows to delete and an OFFSET at which to start deleting the rows', function() {
		qb.reset_query();
		var sql = qb.limit(20,10).delete('galaxies');
		sql.should.eql("DELETE FROM (`galaxies`) LIMIT 10, 20");
	});
});