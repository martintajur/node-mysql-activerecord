const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mysql/query_builder.js');
const qb = new QueryBuilder();

describe('MySQL: group_by()', () => {
    it('should exist', () => {
        should.exist(qb.group_by);
    });
    it('should be a function', () => {
        qb.group_by.should.be.a('function');
    });
    it('should have an array to put fields into', () => {
        qb.should.have.property('group_by_array');
    });
    it('should have an empty array to put fields into at the beginning', () => {
        qb.group_by_array.should.be.empty;
    });
    it('should accept a single field in string form', () => {
        qb.reset_query();
        qb.group_by('planet_type');
        qb.group_by_array.should.eql(['`planet_type`']);
    });
    it('should accept a multiple fields delimited by commas', () => {
        qb.reset_query();
        qb.group_by('planet_type, planet_position');
        qb.group_by_array.should.eql(['`planet_type`','`planet_position`']);
    });
    it('should accept an array of fields', () => {
        qb.reset_query();
        qb.group_by(['planet_type', 'planet_position']);
        qb.group_by_array.should.eql(['`planet_type`','`planet_position`']);
    });
    it('should not accept anything but a string or an array of strings', () => {
        qb.reset_query();
        expect(() => qb.group_by(), 'nothing provided').to.throw(Error);
        expect(() => qb.group_by(null), 'null provided').to.throw(Error);
        expect(() => qb.group_by(false), 'false provided').to.throw(Error);
        expect(() => qb.group_by(true), 'true provided').to.throw(Error);
        expect(() => qb.group_by({}), 'empty object provided').to.throw(Error);
        expect(() => qb.group_by(3), 'integer provided').to.throw(Error);
        expect(() => qb.group_by(3.5), 'float provided').to.throw(Error);
        expect(() => qb.group_by([]), 'empty array provided').to.throw(Error);
        expect(() => qb.group_by([1,2]), 'array of numbers provided').to.throw(Error);
        expect(() => qb.group_by(''), 'empty string provided').to.throw(Error);

        // valid string
        expect(() => qb.group_by('planet_type'), 'valid string provided').to.not.throw(Error);
        expect(() => qb.group_by(['planet_type']), 'array of string(s) provided').to.not.throw(Error);

    });
});
