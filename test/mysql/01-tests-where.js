const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mysql/query_builder.js');
const qb = new QueryBuilder();

describe('MySQL: where()', () => {
    it('should exist', () => {
        should.exist(qb.where);
    });
    it('should be a function', () => {
        qb.where.should.be.a('function');
    });
    it('should have an array to put fields into', () => {
        qb.should.have.property('where_array');
    });
    it('should have an empty array to put fields into at the beginning', () => {
        qb.where_array.should.be.empty;
    });
    it('should not accept anything but a non-empty string or a non-empty object', () => {
        qb.reset_query();
        expect(() => qb.where(), 'nothing provided').to.throw(Error);
        expect(() => qb.where(null), 'null provided').to.throw(Error);
        expect(() => qb.where(false), 'false provided').to.throw(Error);
        expect(() => qb.where(true), 'true provided').to.throw(Error);
        expect(() => qb.where({}), 'empty object provided').to.throw(Error);
        expect(() => qb.where(3), 'integer provided').to.throw(Error);
        expect(() => qb.where(3.5), 'float provided').to.throw(Error);
        expect(() => qb.where([]), 'empty array provided').to.throw(Error);
        expect(() => qb.where([1,2]), 'array of numbers provided').to.throw(Error);
        expect(() => qb.where(''), 'empty string provided').to.throw(Error);

        expect(() => qb.where('planet_position',3), 'valid string provided').to.not.throw(Error);
        expect(() => qb.where({planet_position: 3}), 'valid object provided').to.not.throw(Error);

    });
    it('should accept a field name in the form of a string as the first parameter', () => {
        qb.reset_query();
        qb.where('planet');
        qb.where_array.should.eql(['`planet` IS NULL']);
    });
    it('should assume second param is NULL if not provided', () => {
        qb.reset_query();
        qb.where('planet');
        qb.where_array.should.eql(['`planet` IS NULL']);
    });
    it('should accept NULL as second parameter and assume IS NULL', () => {
        qb.reset_query();
        qb.where('planet',null);
        qb.where_array.should.eql(['`planet` IS NULL']);
    });
    it('should accept boolean values and will transform them properly', () => {
        qb.reset_query();
        qb.where('planet',true);
        qb.where_array.should.eql(['`planet` = 1']);

        qb.reset_query();
        qb.where('planet',false);
        qb.where_array.should.eql(['`planet` = 0']);
    });
    it('should accept integer and float values', () => {
        qb.reset_query();
        qb.where('planet',5);
        qb.where_array.should.eql(['`planet` = 5']);

        qb.reset_query();
        qb.where('planet',123.456);
        qb.where_array.should.eql(['`planet` = 123.456']);
    });
    it('should accept string values', () => {
        qb.reset_query();
        qb.where('planet','Earth');
        qb.where_array.should.eql(["`planet` = 'Earth'"]);

        qb.reset_query();
        qb.where('galaxy','Milky Way');
        qb.where_array.should.eql(["`galaxy` = 'Milky Way'"]);
    });
    it('should accept arrays of values and assume a WHERE IN clause', () => {
        qb.reset_query();
        qb.where('planet',['Mercury','Venus','Earth','Mars']);
        qb.where_array.should.eql(["`planet` IN ('Mercury', 'Venus', 'Earth', 'Mars')"]);
    });
    it('should concatenate multiple where clauses with AND by default', () => {
        qb.reset_query();
        qb.where('planet',['Mercury','Venus','Earth','Mars']);
        qb.where('galaxy','Milky Way');
        qb.where_array.should.eql(["`planet` IN ('Mercury', 'Venus', 'Earth', 'Mars')","AND `galaxy` = 'Milky Way'"]);
    });
    it('should be chainable', () => {
        qb.reset_query();
        qb.where('planet',['Mercury','Venus','Earth','Mars']).where('galaxy','Milky Way');
        qb.where_array.should.eql(["`planet` IN ('Mercury', 'Venus', 'Earth', 'Mars')","AND `galaxy` = 'Milky Way'"]);
    });
    it('should accept an object of key/value pairs (field: value)', () => {
        qb.reset_query();
        qb.where({planet:'Earth',star_system:'Solar'});
        qb.where_array.should.eql(["`planet` = 'Earth'", "AND `star_system` = 'Solar'"]);
    });
    it('should accept an object of key/value pairs (field: value) where values can be arrays', () => {
        qb.reset_query();
        qb.where({star_system:'Solar',planet:['Earth','Mars']});
        qb.where_array.should.eql(["`star_system` = 'Solar'", "AND `planet` IN ('Earth', 'Mars')"]);
    });
    it('should accept an operators in the first parameter', () => {
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
    it('should not escape fields if asked not to', () => {
        qb.reset_query();
        qb.where({star_system: 'Solar', planet: ['Earth', 'Mars']}, false);
        qb.where_array.should.eql(["star_system = 'Solar'", "AND planet IN ('Earth', 'Mars')"]);
    });
    it("should split out and escape custom WHERE strings when that is the only thing provided (except when string contains parenthesis)", () => {
        qb.reset_query();
        qb.where("planet_id = 3 AND galaxy_id > 21645 OR planet = 'Earth'");
        qb.where_array.should.eql(['`planet_id` = 3', 'AND `galaxy_id` > 21645', "OR `planet` = 'Earth'"]);
    });
    it("should not try to escape where clauses utilizing functions or subqueries when provided as a string in the first and only parameter", () => {
        qb.reset_query();
        qb.where("planet_id = 3 AND galaxy_id > (SELECT MIN(id) first_galaxy FROM galaxies WHERE id IN('Milky Way','Andromeda'))");
        qb.where_array.should.eql(["planet_id = 3 AND galaxy_id > (SELECT MIN(id) first_galaxy FROM galaxies WHERE id IN('Milky Way','Andromeda'))"]);
    });
    it("should escape (quote) functions and subqueries as strings when provided as second parameter", () => {
        qb.reset_query();
        qb.where('galaxy_id >', "(SELECT MIN(id) first_galaxy FROM galaxies WHERE id IN('Milky Way','Andromeda'))");
        qb.where_array.should.eql(["`galaxy_id` > '(SELECT MIN(id) first_galaxy FROM galaxies WHERE id IN(\\'Milky Way\\',\\'Andromeda\\'))'"]);
    });
    it('should allow for arrays and non-arrays as values within a where object without dropping anything', () => {
        qb.reset_query();
        qb.where({planet:'Earth', star_system:'Solar', moons: [1,3,5]});
        qb.where_array.should.eql(["`planet` = 'Earth'", "AND `star_system` = 'Solar'", "AND `moons` IN (1, 3, 5)"]);
    });
});

describe('MySQL: or_where()', () => {
    it('should exist', () => {
        should.exist(qb.or_where);
    });
    it('should be a function', () => {
        qb.or_where.should.be.a('function');
    });
    it('should prepend tertiary WHERE clauses with "OR"', () => {
        qb.reset_query();
        qb.or_where('planet','Mars');
        qb.or_where('planet','Venus');
        qb.where_array.should.eql(["`planet` = 'Mars'", "OR `planet` = 'Venus'"]);
    });
    it('should be chainable', () => {
        qb.reset_query();
        qb.or_where('planet','Mars').or_where('planet','Venus');
        qb.where_array.should.eql(["`planet` = 'Mars'", "OR `planet` = 'Venus'"]);
    });
    it('should be chainable with normal where', () => {
        qb.reset_query();
        qb.where('planet','Mars').where('galaxy','Milky Way').or_where('planet','Venus');
        qb.where_array.should.eql(["`planet` = 'Mars'", "AND `galaxy` = 'Milky Way'", "OR `planet` = 'Venus'"]);
    });
});
