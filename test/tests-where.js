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
	it('should accept a field name in the form of a string as the first parameter', function() {
		qb.where('planet');
		qb.whereArray.should.eql(['`planet` IS NULL']);
	});
	it('should assume second param is NULL if not provided', function() {
		qb.resetQuery();
		qb.where('planet');
		qb.whereArray.should.eql(['`planet` IS NULL']);
	});
	it('should accept NULL as second parameter and assume IS NULL', function() {
		qb.resetQuery();
		qb.where('planet',null);
		qb.whereArray.should.eql(['`planet` IS NULL']);
	});
	it('should accept boolean values and will transform them properly', function() {
		qb.resetQuery();
		qb.where('planet',true);
		qb.whereArray.should.eql(['`planet` = 1']);
		
		qb.resetQuery();
		qb.where('planet',false);
		qb.whereArray.should.eql(['`planet` = 0']);
	});
	it('should accept integer and float values', function() {
		qb.resetQuery();
		qb.where('planet',5);
		qb.whereArray.should.eql(['`planet` = 5']);
		
		qb.resetQuery();
		qb.where('planet',123.456);
		qb.whereArray.should.eql(['`planet` = 123.456']);
	});
	it('should accept string values', function() {
		qb.resetQuery();
		qb.where('planet','Earth');
		qb.whereArray.should.eql(["`planet` = 'Earth'"]);
		
		qb.resetQuery();
		qb.where('galaxy','Milky Way');
		qb.whereArray.should.eql(["`galaxy` = 'Milky Way'"]);
	});
	it('should accept arrays of values and assume a WHERE IN clause', function() {
		qb.resetQuery();
		qb.where('planet',['Mercury','Venus','Earth','Mars']);
		qb.whereArray.should.eql(["`planet` IN ('Mercury', 'Venus', 'Earth', 'Mars')"]);
	});
	it('should concatenate multiple where clauses with AND by default', function() {
		qb.resetQuery();
		qb.where('planet',['Mercury','Venus','Earth','Mars']);
		qb.where('galaxy','Milky Way');
		qb.whereArray.should.eql(["`planet` IN ('Mercury', 'Venus', 'Earth', 'Mars')","AND `galaxy` = 'Milky Way'"]);
	});
	it('should be chainable', function() {
		qb.resetQuery();
		qb.where('planet',['Mercury','Venus','Earth','Mars']).where('galaxy','Milky Way');
		qb.whereArray.should.eql(["`planet` IN ('Mercury', 'Venus', 'Earth', 'Mars')","AND `galaxy` = 'Milky Way'"]);
	});
	it('should accept an object of key/value pairs (field: value)', function() {
		qb.resetQuery();
		qb.where({planet:'Earth',star_system:'Solar'});
		qb.whereArray.should.eql(["`planet` = 'Earth'", "AND `star_system` = 'Solar'"]);
	});
	it('should accept an object of key/value pairs (field: value) where values can be arrays', function() {
		qb.resetQuery();
		qb.where({star_system:'Solar',planet:['Earth','Mars']});
		qb.whereArray.should.eql(["`star_system` = 'Solar'", "AND `planet` IN ('Earth', 'Mars')"]);
	});
	it('should accept an operators in the first parameter', function() {
		qb.resetQuery();
		qb.where('position >',3);
		qb.whereArray.should.eql(["`position` > 3"]);
		
		qb.resetQuery();
		qb.where('position <',3);
		qb.whereArray.should.eql(["`position` < 3"]);
		
		qb.resetQuery();
		qb.where('position >=',3);
		qb.whereArray.should.eql(["`position` >= 3"]);
		
		qb.resetQuery();
		qb.where('position <=',3);
		qb.whereArray.should.eql(["`position` <= 3"]);
		
		qb.resetQuery();
		qb.where('position <>',3);
		qb.whereArray.should.eql(["`position` <> 3"]);
		
		qb.resetQuery();
		qb.where('position !=',3);
		qb.whereArray.should.eql(["`position` != 3"]);
	});
	it('should not escape fields if asked not to', function() {
		qb.resetQuery();
		qb.where({star_system:'Solar',planet:['Earth','Mars']},false);
		qb.whereArray.should.eql(["star_system = 'Solar'", "AND planet IN ('Earth', 'Mars')"]);
	});
	it("should even escape complex/compound where clauses when provided as a string in the first and only parameter", function() {
		qb.resetQuery();
		qb.where("planet_id = 3 AND galaxy_id > (SELECT MIN(id) first_galaxy FROM galaxies WHERE id IN('Mikly Way','Andromeda'))");
		qb.whereArray.should.eql("planet_id = 3 AND galaxy_id > (SELECT MIN(id) first_galaxy FROM galaxies WHERE id IN('Mikly Way','Andromeda'))");
	});
});