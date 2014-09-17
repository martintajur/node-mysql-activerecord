var should = require('chai').should();
var expect = require('chai').expect;
var QueryBuilder = require('../lib/query_builder.js');
var qb = new QueryBuilder();

describe('delete()', function() {
	it('should exist', function() {
		should.exist(qb.delete);
	});
	it('should be a function', function() {
		qb.delete.should.be.a('function');
	});
	it('should add a table to fromArray when a table is supplied', function() {
		qb.resetQuery();
		qb.delete('galaxies');
		qb.fromArray.should.eql(['`galaxies`']);
	});
	it('should add a set of tables to fromArray when an array of tables is supplied', function() {
		qb.resetQuery();
		qb.delete(['galaxies','star_systems','planets']);
		qb.fromArray.should.eql(['`galaxies`','`star_systems`','`planets`']);
	});
	it('should add where conditions to whereArray when conditions are supplied', function() {
		qb.resetQuery();
		qb.delete('planets', {continents: 7, star_system: 'Solar'});
		qb.whereArray.should.eql(["`continents` = 7", "AND `star_system` = 'Solar'"]);
	});
	it('should accept an array of tables and an object of where conditions and put each in their respective arrays', function() {
		qb.resetQuery();
		qb.delete(['galaxies','star_systems','planets'], {continents: 7, star_system: 'Solar'});
		qb.fromArray.should.eql(['`galaxies`','`star_systems`','`planets`']);
		qb.whereArray.should.eql(["`continents` = 7", "AND `star_system` = 'Solar'"]);
	});
	it('should return a string', function() {
		qb.resetQuery();
		var sql = qb.delete(['galaxies','star_systems','planets'], {continents: 7, star_system: 'Solar'});
		expect(sql).to.be.a('string');
		expect(sql).to.exist;
		expect(sql).to.not.eql('');
	});
	it('should build a properly-escaped delete statement that deletes all records in a table if only a table is given', function() {
		qb.resetQuery();
		var sql = qb.delete('galaxies');
		sql.should.eql('DELETE FROM (`galaxies`)');
	});
	it('should build a properly-escaped delete statement that deletes all records in a table that matched passed conditions', function() {
		qb.resetQuery();
		var sql = qb.delete('galaxies', {class: 'M'});
		sql.should.eql("DELETE FROM (`galaxies`) WHERE `class` = 'M'");
	});
	it('should build a properly-escaped delete statement that deletes all records in a set of tables if an array of tables is given', function() {
		qb.resetQuery();
		var sql = qb.delete(['galaxies','star_systems','planets']);
		sql.should.eql('DELETE FROM (`galaxies`, `star_systems`, `planets`)');
	});
	it('should build a properly-escaped delete statement that deletes all records in a set of tables that match the passed conditions', function() {
		qb.resetQuery();
		var sql = qb.delete(['galaxies','star_systems','planets'], {class: 'M'});
		sql.should.eql("DELETE FROM (`galaxies`, `star_systems`, `planets`) WHERE `class` = 'M'");
	});
	it('should use tables added previously via the from() method', function() {
		qb.resetQuery();
		qb.from('galaxies');
		var sql = qb.delete();
		sql.should.eql('DELETE FROM (`galaxies`)');
		
		qb.resetQuery();
		var sql = qb.from(['galaxies','star_systems','planets']).delete();
		sql.should.eql('DELETE FROM (`galaxies`, `star_systems`, `planets`)');
	});
	it('should accept where conditions added previously via the where() method', function() {
		qb.resetQuery();
		var sql = qb.where('created >=',4.6E9).where({class: 'M'}).delete('galaxies');
		sql.should.eql("DELETE FROM (`galaxies`) WHERE `created` >= 4600000000 AND `class` = 'M'");
	});
});