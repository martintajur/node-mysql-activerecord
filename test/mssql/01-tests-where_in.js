const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mssql/query_builder.js');
const qb = new QueryBuilder();

describe('MSSQL: where_in()', () => {
    it('should exist', () => {
        should.exist(qb.where_in);
    });
    it('should be a function', () => {
        qb.where_in.should.be.a('function');
    });
    it('should have an array to put fields into', () => {
        qb.should.have.property('where_in_array');
    });
    it('should have an empty array to put fields into at the beginning', () => {
        qb.where_in_array.should.be.empty;
    });
    it('should not accept anything but a non-empty string as first parameter', () => {
        qb.reset_query();
        expect(() => qb.where_in(), 'nothing provided').to.throw(Error);
        expect(() => qb.where_in(null), 'null provided').to.throw(Error);
        expect(() => qb.where_in(false), 'false provided').to.throw(Error);
        expect(() => qb.where_in(true), 'true provided').to.throw(Error);
        expect(() => qb.where_in({}), 'empty object provided').to.throw(Error);
        expect(() => qb.where_in({foo:'bar'}), 'empty object provided').to.throw(Error);
        expect(() => qb.where_in(3), 'integer provided').to.throw(Error);
        expect(() => qb.where_in(3.5), 'float provided').to.throw(Error);
        expect(() => qb.where_in(NaN), 'NaN provided').to.throw(Error);
        expect(() => qb.where_in(Infinity), 'Infinity provided').to.throw(Error);
        expect(() => qb.where_in([]), 'empty array provided').to.throw(Error);
        expect(() => qb.where_in([1,2]), 'array of numbers provided').to.throw(Error);
        expect(() => qb.where_in(''), 'empty string provided').to.throw(Error);
        expect(() => qb.where_in(/foobar/), 'regex provided').to.throw(Error);

        expect(() => qb.where_in('planet_position',[1,2,3]), 'valid string provided').to.not.throw(Error);
    });
    it('should not accept anything but a non-empty array of values as second parameter', () => {
        qb.reset_query();
        expect(() => qb.where_in('planet', null), 'null provided').to.throw(Error);
        expect(() => qb.where_in('planet', false), 'false provided').to.throw(Error);
        expect(() => qb.where_in('planet', true), 'true provided').to.throw(Error);
        expect(() => qb.where_in('planet', {}), 'empty object provided').to.throw(Error);
        expect(() => qb.where_in('planet', {foo:'bar'}), 'empty object provided').to.throw(Error);
        expect(() => qb.where_in('planet', 3), 'integer provided').to.throw(Error);
        expect(() => qb.where_in('planet', 3.5), 'float provided').to.throw(Error);
        expect(() => qb.where_in('planet', NaN), 'NaN provided').to.throw(Error);
        expect(() => qb.where_in('planet', Infinity), 'Infinity provided').to.throw(Error);
        expect(() => qb.where_in('planet', ''), 'empty string provided').to.throw(Error);
        expect(() => qb.where_in('planet', /foobar/), 'regex provided').to.throw(Error);

        expect(() => qb.where_in('planet'), 'nothing provided (empty array is default value)').to.not.throw(Error);
        expect(() => qb.where_in('planet', []), 'empty array provided').to.not.throw(Error);
        expect(() => qb.where_in('planet', ['Mars','Earth','Venus','Mercury']), 'non-empty array provided').to.not.throw(Error);
    });
    it('should require both a field name an array of values as first and second parameters, respectively', () => {
        qb.reset_query();
        qb.where_in('planet_position', [1,2,3]);
        qb.where_array.should.eql(['[planet_position] IN (1, 2, 3)']);
    });
    it('should ignore the request if an empty array is provided to the second parameter', () => {
        qb.reset_query();
        qb.where_in('planet_position', []);
        qb.where_array.should.eql([]);
    });
    it('should concatenate multiple WHERE IN clauses with AND ', () => {
        qb.reset_query();
        qb.where_in('planet',['Mercury','Venus','Earth','Mars']);
        qb.where_in('galaxy_id', [123,456,789,0110]);
        qb.where_array.should.eql(["[planet] IN ('Mercury', 'Venus', 'Earth', 'Mars')","AND [galaxy_id] IN (123, 456, 789, 72)"]);
    });
    it('should be chainable', () => {
        qb.reset_query();
        qb.where_in('planet', ['Mercury','Venus','Earth','Mars']).where_in('planet_position',[1,2,3,4]);
        qb.where_array.should.eql(["[planet] IN ('Mercury', 'Venus', 'Earth', 'Mars')","AND [planet_position] IN (1, 2, 3, 4)"]);
    });
    it('should not escape fields if asked not to', () => {
        qb.reset_query();
        qb.where_in('planet_position', [1, 2, 3],false);
        qb.where_array.should.eql(['planet_position IN (1, 2, 3)']);
    });
});

describe('MSSQL: where_not_in()', () => {
    it('should exist', () => {
        should.exist(qb.where_not_in);
    });
    it('should be a function', () => {
        qb.where_not_in.should.be.a('function');
    });
    it('should prepend "NOT " to "IN"', () => {
        qb.reset_query();
        qb.where_not_in('planet_position',[1,2,3]);
        qb.where_array.should.eql(['[planet_position] NOT IN (1, 2, 3)']);
    });
    it('should prepend tertiary WHERE clauses with "AND"', () => {
        qb.reset_query();
        qb.where_not_in('planet_position',[1,2,3]);
        qb.where_not_in('planet_position',[5,6,7]);
        qb.where_array.should.eql(['[planet_position] NOT IN (1, 2, 3)', "AND [planet_position] NOT IN (5, 6, 7)"]);
    });
    it('should be chainable', () => {
        qb.reset_query();
        qb.where_not_in('planet_position',[1,2,3]).where_not_in('planet_position',[5,6,7]);
        qb.where_array.should.eql(['[planet_position] NOT IN (1, 2, 3)', "AND [planet_position] NOT IN (5, 6, 7)"]);
    });
    it('should be chainable with normal where', () => {
        qb.reset_query();
        qb.where('planet','Mars').where('galaxy','Milky Way').where_not_in('planet_position',[5,6,7]);
        qb.where_array.should.eql(["[planet] = 'Mars'", "AND [galaxy] = 'Milky Way'",  "AND [planet_position] NOT IN (5, 6, 7)"]);
    });
    it('should not escape fields if asked not to', () => {
        qb.reset_query();
        qb.where_not_in('planet_position',[1,2,3],false);
        qb.where_array.should.eql(['planet_position NOT IN (1, 2, 3)']);
    });
});

describe('MSSQL: or_where_in()', () => {
    it('should exist', () => {
        should.exist(qb.or_where_in);
    });
    it('should be a function', () => {
        qb.or_where_in.should.be.a('function');
    });
    it('should prepend tertiary WHERE clauses with "OR"', () => {
        qb.reset_query();
        qb.or_where_in('planet_position',[1,2,3]);
        qb.or_where_in('planet_position',[5,6,7]);
        qb.where_array.should.eql(['[planet_position] IN (1, 2, 3)', "OR [planet_position] IN (5, 6, 7)"]);
    });
    it('should be chainable', () => {
        qb.reset_query();
        qb.or_where_in('planet_position',[1,2,3]).or_where_in('planet_position',[5,6,7]);
        qb.where_array.should.eql(['[planet_position] IN (1, 2, 3)', "OR [planet_position] IN (5, 6, 7)"]);
    });
    it('should be chainable with normal where', () => {
        qb.reset_query();
        qb.where('planet','Mars').where('galaxy','Milky Way').or_where_in('planet_position',[5,6,7]);
        qb.where_array.should.eql(["[planet] = 'Mars'", "AND [galaxy] = 'Milky Way'",  "OR [planet_position] IN (5, 6, 7)"]);
    });
    it('should not escape fields if asked not to', () => {
        qb.reset_query();
        qb.or_where_in('planet_position',[1,2,3],false);
        qb.where_array.should.eql(['planet_position IN (1, 2, 3)']);
    });
});

describe('MSSQL: or_where_not_in()', () => {
    it('should exist', () => {
        should.exist(qb.or_where_in);
    });
    it('should be a function', () => {
        qb.or_where_in.should.be.a('function');
    });
    it('should prepend "NOT " to "IN"', () => {
        qb.reset_query();
        qb.or_where_not_in('planet_position',[1,2,3]);
        qb.where_array.should.eql(['[planet_position] NOT IN (1, 2, 3)']);
    });
    it('should prepend tertiary WHERE clauses with "OR"', () => {
        qb.reset_query();
        qb.or_where_not_in('planet_position',[1,2,3]);
        qb.or_where_not_in('planet_position',[5,6,7]);
        qb.where_array.should.eql(['[planet_position] NOT IN (1, 2, 3)', "OR [planet_position] NOT IN (5, 6, 7)"]);
    });
    it('should be chainable', () => {
        qb.reset_query();
        qb.or_where_not_in('planet_position',[1,2,3]).or_where_not_in('planet_position',[5,6,7]);
        qb.where_array.should.eql(['[planet_position] NOT IN (1, 2, 3)', "OR [planet_position] NOT IN (5, 6, 7)"]);
    });
    it('should be chainable with normal where', () => {
        qb.reset_query();
        qb.where('planet','Mars').where('galaxy','Milky Way').or_where_not_in('planet_position',[5,6,7]);
        qb.where_array.should.eql(["[planet] = 'Mars'", "AND [galaxy] = 'Milky Way'",  "OR [planet_position] NOT IN (5, 6, 7)"]);
    });
    it('should not escape fields if asked not to', () => {
        qb.reset_query();
        qb.or_where_not_in('planet_position',[1,2,3],false);
        qb.where_array.should.eql(['planet_position NOT IN (1, 2, 3)']);
    });
});
