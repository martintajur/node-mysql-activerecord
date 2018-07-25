const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mysql/query_builder.js');
const qb = new QueryBuilder();

describe('MySQL: truncate()', () => {
    it('should exist', () => {
        should.exist(qb.truncate);
    });
    it('should be a function', () => {
        qb.truncate.should.be.a('function');
    });
    it('should return a string', () => {
        qb.reset_query();
        const sql = qb.truncate('galaxies');
        expect(sql).to.be.a('string');
        expect(sql).to.exist;
        expect(sql).to.not.eql('');
    });
    it('should build a proper truncate statement', () => {
        qb.reset_query();
        const sql = qb.truncate('galaxies');
        sql.should.eql('TRUNCATE `galaxies`');
    });
});
