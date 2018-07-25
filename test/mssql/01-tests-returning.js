const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mssql/query_builder.js');
const qb = new QueryBuilder();

describe('MSSQL: returning()', () => {
    it('should exist', () => {
        should.exist(qb.returning);
    });
    it('should be a function', () => {
        qb.returning.should.be.a('function');
    });
    it('should have an array to put ids into', () => {
        qb.should.have.property('returning_ids');
    });
    it('should have an empty array to put ids into at the beginning', () => {
        qb.returning_ids.should.be.empty;
    });
    it('should not accept anything but a non-empty string or a non-empty array', () => {
        qb.reset_query();
        expect(() => qb.returning(), 'nothing provided').to.throw(Error);
        expect(() => qb.returning(null), 'null provided').to.throw(Error);
        expect(() => qb.returning(false), 'false provided').to.throw(Error);
        expect(() => qb.returning(true), 'true provided').to.throw(Error);
        expect(() => qb.returning({}), 'empty object provided').to.throw(Error);
        expect(() => qb.returning(3), 'integer provided').to.throw(Error);
        expect(() => qb.returning(3.5), 'float provided').to.throw(Error);
        expect(() => qb.returning([]), 'empty array provided').to.throw(Error);
        expect(() => qb.returning([1,2]), 'array of numbers provided').to.throw(Error);
        expect(() => qb.returning(''), 'empty string provided').to.throw(Error);

        expect(() => qb.returning('id'), 'valid string provided').to.not.throw(Error);
        expect(() => qb.returning(['id', 'other_id']), 'valid array provided').to.not.throw(Error);

    });
    it('should accept a column name in the form of a string as the first parameter', () => {
        qb.reset_query();
        qb.returning('planet');
        qb.returning_ids.should.eql(['INSERTED.[planet]']);
    });
    it('should accept an array of column names in the form of strings', () => {
        qb.reset_query();
        qb.returning(['planet', 'id']);
        qb.returning_ids.should.eql(['INSERTED.[planet]', 'INSERTED.[id]']);
    });
});
