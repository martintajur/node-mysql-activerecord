const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mysql/query_builder.js');
const qb = new QueryBuilder();

describe('MySQL: empty_table()', () => {
    it('should exist', () => {
        should.exist(qb.empty_table);
    });
    it('should be a function', () => {
        qb.empty_table.should.be.a('function');
    });
    it('should return a string', () => {
        qb.reset_query();
        const sql = qb.empty_table('galaxies');
        expect(sql).to.be.a('string');
        expect(sql).to.exist;
        expect(sql).to.not.eql('');
    });
    it('should build a proper DELETE statement', () => {
        qb.reset_query();
        const sql = qb.empty_table('galaxies');
        sql.should.eql('DELETE FROM `galaxies`');
    });
    it('should only accept nothing or a non-empty-string for the table (first) parameter', () => {
        qb.reset_query();

        expect(() => qb.empty_table([]), 'empty array provided').to.throw(Error);
        expect(() => qb.empty_table({}), 'empty object provided').to.throw(Error);
        expect(() => qb.empty_table(3), 'integer provided').to.throw(Error);
        expect(() => qb.empty_table(3.5), 'float provided').to.throw(Error);
        expect(() => qb.empty_table(true), 'true provided').to.throw(Error);
        expect(() => qb.empty_table(Infinity), 'Infinity provided').to.throw(Error);
        expect(() => qb.empty_table([1,2]), 'array of numbers provided').to.throw(Error);
        expect(() => qb.empty_table(/foobar/), 'regex provided').to.throw(Error);
        expect(() => qb.empty_table(NaN), 'NaN provided').to.throw(Error);
        expect(() => qb.empty_table(false), 'false provided').to.throw(Error);
        expect(() => qb.empty_table(''), 'empty string provided').to.throw(Error);
        expect(() => qb.empty_table('  '), 'string full of spaces provided').to.throw(Error);
        expect(() => qb.empty_table(null), 'null provided').to.throw(Error);

        // An undefined/nothing option will only work if a table has already been provided
        qb.from('galaxies'); expect(() => qb.empty_table(undefined),'undefined provided').to.not.throw(Error);
        qb.from('galaxies'); expect(() => qb.empty_table(),'nothing provided').to.not.throw(Error);
    });
    it('should only use the first table supplied in a list if an array of table is supplied with the from() method.', () => {
        qb.reset_query();
        const sql = qb.from(['galaxies','star_systems','planets']).empty_table();
        sql.should.eql("DELETE FROM `galaxies`");
    });
});
