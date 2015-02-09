var should = require('chai').should();
var expect = require('chai').expect;
var qb = require('../../drivers/mysql/query_builder.js').QueryBuilder();

describe('where()', function() {
	it('should exist', function() {
		should.exist(qb.where);
	});
	it('should be a function', function() {
		qb.where.should.be.a('function');
	});
	it('should have an array to put fields into', function() {
		qb.should.have.property('where_array');
	});
	it('should have an empty array to put fields into at the beginning', function() {
		qb.where_array.should.be.empty;
	});
	it('should not accept anything but a non-empty string or a non-empty object', function() {
		qb.reset_query();
		expect(function() { qb.where(); 		}, 'nothing provided').to.throw(Error);
		expect(function() { qb.where(null); 	}, 'null provided').to.throw(Error);
		expect(function() { qb.where(false); 	}, 'false provided').to.throw(Error);
		expect(function() { qb.where(true); 	}, 'true provided').to.throw(Error);
		expect(function() { qb.where({}); 		}, 'empty object provided').to.throw(Error);
		expect(function() { qb.where(3); 		}, 'integer provided').to.throw(Error);
		expect(function() { qb.where(3.5); 		}, 'float provided').to.throw(Error);
		expect(function() { qb.where([]); 		}, 'empty array provided').to.throw(Error);
		expect(function() { qb.where([1,2]); 	}, 'array of numbers provided').to.throw(Error);
		expect(function() { qb.where(''); 		}, 'empty string provided').to.throw(Error);
		
		expect(function() { qb.where('planet_position',3);	}, 'valid string provided').to.not.throw(Error);
		expect(function() { qb.where({planet_position: 3}); }, 'valid object provided').to.not.throw(Error);
		
	});
	it('should accept a field name in the form of a string as the first parameter', function() {
		qb.reset_query();
		qb.where('planet');
		qb.where_array.should.eql(['`planet` IS NULL']);
	});
	it('should assume second param is NULL if not provided', function() {
		qb.reset_query();
		qb.where('planet');
		qb.where_array.should.eql(['`planet` IS NULL']);
	});
	it('should accept NULL as second parameter and assume IS NULL', function() {
		qb.reset_query();
		qb.where('planet',null);
		qb.where_array.should.eql(['`planet` IS NULL']);
	});
	it('should accept boolean values and will transform them properly', function() {
		qb.reset_query();
		qb.where('planet',true);
		qb.where_array.should.eql(['`planet` = 1']);
		
		qb.reset_query();
		qb.where('planet',false);
		qb.where_array.should.eql(['`planet` = 0']);
	});
	it('should accept integer and float values', function() {
		qb.reset_query();
		qb.where('planet',5);
		qb.where_array.should.eql(['`planet` = 5']);
		
		qb.reset_query();
		qb.where('planet',123.456);
		qb.where_array.should.eql(['`planet` = 123.456']);
	});
	it('should accept string values', function() {
		qb.reset_query();
		qb.where('planet','Earth');
		qb.where_array.should.eql(["`planet` = 'Earth'"]);
		
		qb.reset_query();
		qb.where('galaxy','Milky Way');
		qb.where_array.should.eql(["`galaxy` = 'Milky Way'"]);
	});
	it('should accept arrays of values and assume a WHERE IN clause', function() {
		qb.reset_query();
		qb.where('planet',['Mercury','Venus','Earth','Mars']);
		qb.where_array.should.eql(["`planet` IN ('Mercury', 'Venus', 'Earth', 'Mars')"]);
	});
	it('should concatenate multiple where clauses with AND by default', function() {
		qb.reset_query();
		qb.where('planet',['Mercury','Venus','Earth','Mars']);
		qb.where('galaxy','Milky Way');
		qb.where_array.should.eql(["`planet` IN ('Mercury', 'Venus', 'Earth', 'Mars')","AND `galaxy` = 'Milky Way'"]);
	});
	it('should be chainable', function() {
		qb.reset_query();
		qb.where('planet',['Mercury','Venus','Earth','Mars']).where('galaxy','Milky Way');
		qb.where_array.should.eql(["`planet` IN ('Mercury', 'Venus', 'Earth', 'Mars')","AND `galaxy` = 'Milky Way'"]);
	});
	it('should accept an object of key/value pairs (field: value)', function() {
		qb.reset_query();
		qb.where({planet:'Earth',star_system:'Solar'});
		qb.where_array.should.eql(["`planet` = 'Earth'", "AND `star_system` = 'Solar'"]);
	});
	it('should accept an object of key/value pairs (field: value) where values can be arrays', function() {
		qb.reset_query();
		qb.where({star_system:'Solar',planet:['Earth','Mars']});
		qb.where_array.should.eql(["`star_system` = 'Solar'", "AND `planet` IN ('Earth', 'Mars')"]);
	});
	it('should accept an operators in the first parameter', function() {
		qb.reset_query();
		qb.where('position >',3);
		qb.where_array.should.eql(["`position` > 3"]);
		
		qb.reset_query();
		qb.where('position <',3);
		qb.where_array.should.eql(["`position` < 3"]);
		
		qb.reset_query();
		qb.where('position >=',3);
		qb.where_array.should.eql(["`position` >= 3"]);
		
		qb.reset_query();
		qb.where('position <=',3);
		qb.where_array.should.eql(["`position` <= 3"]);
		
		qb.reset_query();
		qb.where('position <>',3);
		qb.where_array.should.eql(["`position` <> 3"]);
		
		qb.reset_query();
		qb.where('position !=',3);
		qb.where_array.should.eql(["`position` != 3"]);
	});
	it('should not escape fields if asked not to', function() {
		qb.reset_query();
		qb.where({star_system:'Solar',planet:['Earth','Mars']},false);
		qb.where_array.should.eql(["star_system = 'Solar'", "AND planet IN ('Earth', 'Mars')"]);
	});
	it("should split out and escape custom WHERE strings when that is the only thing provided (except when string contains parenthesis)", function() {
		qb.reset_query();
		qb.where("planet_id = 3 AND galaxy_id > 21645 OR planet = 'Earth'");
		qb.where_array.should.eql(['`planet_id` = 3', 'AND `galaxy_id` > 21645', "OR `planet` = 'Earth'"]);
	});
	it("should not try to escape where clauses utilizing functions or subqueries when provided as a string in the first and only parameter", function() {
		qb.reset_query();
		qb.where("planet_id = 3 AND galaxy_id > (SELECT MIN(id) first_galaxy FROM galaxies WHERE id IN('Milky Way','Andromeda'))");
		qb.where_array.should.eql(["planet_id = 3 AND galaxy_id > (SELECT MIN(id) first_galaxy FROM galaxies WHERE id IN('Milky Way','Andromeda'))"]);
	});
	it("should escape (quote) functions and subqueries as strings when provided as second parameter", function() {
		qb.reset_query();
		qb.where('galaxy_id >', "(SELECT MIN(id) first_galaxy FROM galaxies WHERE id IN('Milky Way','Andromeda'))");
		qb.where_array.should.eql(["`galaxy_id` > '(SELECT MIN(id) first_galaxy FROM galaxies WHERE id IN(\\'Milky Way\\',\\'Andromeda\\'))'"]);
	});
});

describe('or_where()', function() {
	it('should exist', function() {
		should.exist(qb.or_where);
	});
	it('should be a function', function() {
		qb.or_where.should.be.a('function');
	});
	it('should prepend tertiary WHERE clauses with "OR"', function() {
		qb.reset_query();
		qb.or_where('planet','Mars');
		qb.or_where('planet','Venus');
		qb.where_array.should.eql(["`planet` = 'Mars'", "OR `planet` = 'Venus'"]);
	});
	it('should be chainable', function() {
		qb.reset_query();
		qb.or_where('planet','Mars').or_where('planet','Venus');
		qb.where_array.should.eql(["`planet` = 'Mars'", "OR `planet` = 'Venus'"]);
	});
	it('should be chainable with normal where', function() {
		qb.reset_query();
		qb.where('planet','Mars').where('galaxy','Milky Way').or_where('planet','Venus');
		qb.where_array.should.eql(["`planet` = 'Mars'", "AND `galaxy` = 'Milky Way'", "OR `planet` = 'Venus'"]);
	});
});