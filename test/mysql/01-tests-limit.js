const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mysql/query_builder.js');
const qb = new QueryBuilder();

describe('MySQL: limit()', () => {
    it('should exist', () => {
        should.exist(qb.limit);
    });
    it('should be a function', () => {
        qb.limit.should.be.a('function');
    });
    it('should have an array to put fields into', () => {
        qb.should.have.property('limit_to');
    });
    it('should have an empty array to put fields into at the beginning', () => {
        qb.limit_to.should.be.empty;
    });
    it('should require an integer (or integer in string form) in first parameter', () => {
        qb.reset_query();
        expect(() => qb.limit(5), 'integer provided').to.not.throw(Error);
        expect(() => qb.limit('5'), '5 in string form provided').to.not.throw(Error);
        expect(() => qb.limit(5.7), 'float provided').to.throw(Error);
        expect(() => qb.limit('5.7'), 'float provided').to.throw(Error);
        expect(() => qb.limit('abc'), 'alpha provided').to.throw(Error);
        expect(() => qb.limit('abc7'), 'alpha numerics provided').to.throw(Error);
        expect(() => qb.limit(), 'nothing provided').to.throw(Error);
        expect(() => qb.limit(null), 'null provided').to.throw(Error);
        expect(() => qb.limit(true), 'true provided').to.throw(Error);
        expect(() => qb.limit(false), 'false provided').to.throw(Error);
        expect(() => qb.limit(''), 'empty string provided').to.throw(Error);
        expect(() => qb.limit({}), 'empty object provided').to.throw(Error);
        expect(() => qb.limit([]), 'empty array provided').to.throw(Error);
        expect(() => qb.limit([5]), 'array with integer in it provided').to.throw(Error);
    });
    it('should allow an integer (or integer in string form) in second parameter. Nothing else is allowed.', () => {
        qb.reset_query();
        expect(() => qb.limit(10,5), 'integer provided').to.not.throw(Error);
        expect(() => qb.limit(10,'5'), '5 in string form provided').to.not.throw(Error);
        expect(() => qb.limit(10,5.7), 'float provided').to.throw(Error);
        expect(() => qb.limit(10,'5.7'), 'float provided').to.throw(Error);
        expect(() => qb.limit(10,'abc'), 'alpha provided').to.throw(Error);
        expect(() => qb.limit(10,'abc7'), 'alphanumerics provided').to.throw(Error);
        expect(() => qb.limit(10,null), 'null provided').to.throw(Error);
        expect(() => qb.limit(10,true), 'true provided').to.throw(Error);
        expect(() => qb.limit(10,false), 'false provided').to.throw(Error);
        expect(() => qb.limit(10,''), 'empty string provided').to.throw(Error);
        expect(() => qb.limit(10,{}), 'empty object provided').to.throw(Error);
        expect(() => qb.limit(10,[]), 'empty array provided').to.throw(Error);
        expect(() => qb.limit(10,[5]), 'array with integer in it provided').to.throw(Error);
    });
    it('should override the default limit_to value when a limit is provided', () => {
        qb.reset_query();
        qb.limit(10);
        qb.limit_to.should.eql([10]);
    });
    it('should override the default limit_to and offset_val values when a limit and an offset are provided', () => {
        qb.reset_query();
        qb.limit(10,20);
        qb.limit_to.should.eql([10]);
        qb.offset_val.should.eql([20]);
    });
    it('should trim string values that are provided', () => {
        qb.reset_query();
        qb.limit('10    ');
        qb.limit_to.should.eql([10]);
    });
    it('should trim string values that are provided', () => {
        qb.reset_query();
        qb.limit('   10   ','    12');
        qb.limit_to.should.eql([10]);
        qb.offset_val.should.eql([12]);
    });
    it('should override values set by any previous calls to itself', () => {
        qb.reset_query();
        qb.limit(10);
        qb.limit_to.should.eql([10]);
        qb.limit(20);
        qb.limit_to.should.eql([20]);
    });
    it('should be chainable whereby the last call to the method will contain the value(s) used', () => {
        qb.reset_query();
        qb.limit(10,5).limit(20).limit(100,30);
        qb.limit_to.should.eql([100]);
        qb.offset_val.should.eql([30]);
    });
});
