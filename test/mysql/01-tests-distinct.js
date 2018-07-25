const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mysql/query_builder.js');
const qb = new QueryBuilder();

describe('MySQL: distinct()', () => {
    it('should exist', () => {
        should.exist(qb.distinct);
    });
    it('should be a function', () => {
        qb.distinct.should.be.a('function');
    });
    it('should override the default distinct_clause with the "DISTINCT " keyword', () => {
        qb.reset_query();
        qb.distinct();
        qb.distinct_clause.should.eql(['DISTINCT ']);
    });
});
