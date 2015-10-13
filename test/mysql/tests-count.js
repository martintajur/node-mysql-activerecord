var should = require('chai').should();
var expect = require('chai').expect;
var qb = require('../../drivers/mysql/query_builder.js').QueryBuilder();

describe('count()', function() {
	it('should exist', function() {
		should.exist(qb.count);
	});
	it('should be a function', function() {
		qb.count.should.be.a('function');
	});
	it('should require that an item already exists in the from_array if one is not provided as the first parameter', function() {
		qb.reset_query();
		expect(function() { qb.count(); 					}, 'no tables supplied in chain').to.throw(Error);
		expect(function() { qb.from('galaxies').count(); 	}, 'table supplied by from()').to.not.throw(Error);
		expect(function() { qb.count('galaxies'); 			}, 'table supplied as first parameter').to.not.throw(Error);
	});
	it('should add a table to from_array when a table is supplied', function() {
		qb.reset_query();
		var sql = qb.count('galaxies');
		qb.from_array.should.eql(['`galaxies`']);
	});
	it('should return a string', function() {
		qb.reset_query();
		var sql = qb.count('galaxies');
		expect(sql).to.be.a('string');
		expect(sql).to.exist;
		expect(sql).to.not.eql('');
	});
	it('should create a properly-escaped SELECT query', function() {
		qb.reset_query();
		var sql = qb.count('galaxies');
		sql.should.eql("SELECT COUNT(*) AS `numrows` FROM `galaxies`");
	});
	it('should include WHERE statements', function() {
		qb.reset_query();
		var sql = qb.where({type:'spiral'}).count('galaxies');
		sql.should.eql("SELECT COUNT(*) AS `numrows` FROM `galaxies` WHERE `type` = 'spiral'");
	});
	it('should work when table/view/procedure is provided earlier in chain but not in count() method', function() {
		qb.reset_query();
		var sql = qb.from('galaxies').count();
		sql.should.eql("SELECT COUNT(*) AS `numrows` FROM `galaxies`");
	});
	it('should work with multiple tables/views/stored procedures', function() {
		qb.reset_query();
		var sql = qb.from(['planets','galaxies']).count();
		sql.should.eql("SELECT COUNT(*) AS `numrows` FROM `planets`, `galaxies`");
	});
	it('should include any joins that were added in the chain', function() {
		qb.reset_query();
		var sql = qb.join('galaxies g','g.id=s.galaxy_id','left').count('star_systems s');
		sql.should.eql("SELECT COUNT(*) AS `numrows` FROM `star_systems` `s` LEFT JOIN `galaxies` `g` ON `g`.`id`=`s`.`galaxy_id`");
	});
});
