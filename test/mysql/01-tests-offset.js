const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mysql/query_builder.js');
const qb = new QueryBuilder();

describe('MySQL: offset()', () => {
    it('should exist', () => {
        should.exist(qb.offset);
    });
    it('should be a function', () => {
        qb.offset.should.be.a('function');
    });
    it('should have an array to put fields into', () => {
        qb.should.have.property('offset_val');
    });
    it('should have an empty array to put fields into at the beginning', () => {
        qb.offset_val.should.be.empty;
    });
    it('should require an integer (or integer in string form) in first parameter', () => {
        qb.reset_query();
        expect(() => qb.offset(5), 'integer provided').to.not.throw(Error);
        expect(() => qb.offset('5'), '5 in string form provided').to.not.throw(Error);
        expect(() => qb.offset(5.7), 'float provided').to.throw(Error);
        expect(() => qb.offset('5.7'), 'float provided').to.throw(Error);
        expect(() => qb.offset('abc'), 'alpha provided').to.throw(Error);
        expect(() => qb.offset('abc7'), 'alpha numerics provided').to.throw(Error);
        expect(() => qb.offset(), 'nothing provided').to.throw(Error);
        expect(() => qb.offset(null), 'null provided').to.throw(Error);
        expect(() => qb.offset(true), 'true provided').to.throw(Error);
        expect(() => qb.offset(false), 'false provided').to.throw(Error);
        expect(() => qb.offset(''), 'empty string provided').to.throw(Error);
        expect(() => qb.offset({}), 'empty object provided').to.throw(Error);
        expect(() => qb.offset([]), 'empty array provided').to.throw(Error);
        expect(() => qb.offset([5]), 'array with integer in it provided').to.throw(Error);
    });
    it('should override the default offset_val value when a offset is provided', () => {
        qb.reset_query();
        qb.offset(10);
        qb.offset_val.should.eql([10]);
    });
    it('should trim string values that are provided', () => {
        qb.reset_query();
        qb.offset('10      ');
        qb.offset('      10');
        qb.offset('   10   ');
        qb.offset_val.should.eql([10]);
    });
    it('should override values set by any previous calls to itself', () => {
        qb.reset_query();
        qb.offset(10);
        qb.offset_val.should.eql([10]);
        qb.offset(20);
        qb.offset_val.should.eql([20]);
    });
    it('should be chainable whereby the last call to the method will contain the value used', () => {
        qb.reset_query();
        qb.offset(10).offset(20).offset(100);
        qb.offset_val.should.eql([100]);
    });
});
