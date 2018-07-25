const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mssql/query_builder.js');
const qb = new QueryBuilder();

describe('MSSQL: delete()', () => {
    it('should exist', () => {
        should.exist(qb.delete);
    });
    it('should be a function', () => {
        qb.delete.should.be.a('function');
    });
    it('should add a table to from_array when a table is supplied', () => {
        qb.reset_query();
        qb.delete('galaxies');
        qb.from_array.should.eql(['[galaxies]']);
    });
    it('should only accept nothing or a non-empty-string for the table (first) parameter', () => {
        qb.reset_query();

        expect(() => qb.delete([]), 'empty array provided').to.throw(Error);
        expect(() => qb.delete({}), 'empty object provided').to.throw(Error);
        expect(() => qb.delete(3), 'integer provided').to.throw(Error);
        expect(() => qb.delete(3.5), 'float provided').to.throw(Error);
        expect(() => qb.delete(true), 'true provided').to.throw(Error);
        expect(() => qb.delete(Infinity), 'Infinity provided').to.throw(Error);
        expect(() => qb.delete([1,2]), 'array of numbers provided').to.throw(Error);
        expect(() => qb.delete(/foobar/), 'regex provided').to.throw(Error);
        expect(() => qb.delete(NaN), 'NaN provided').to.throw(Error);
        expect(() => qb.delete(false), 'false provided').to.throw(Error);
        expect(() => qb.delete(''), 'empty string provided').to.throw(Error);
        expect(() => qb.delete('  '), 'string full of spaces provided').to.throw(Error);
        expect(() => qb.delete(null), 'null provided').to.throw(Error);

        // An undefined/nothing option will only work if a table has already been provided
        qb.from('galaxies'); expect(() => qb.delete(undefined),'undefined provided').to.not.throw(Error);
        qb.from('galaxies'); expect(() => qb.delete(),'nothing provided').to.not.throw(Error);
    });
    it('should only use the first table supplied in a list if an array of table is supplied with the from() method.', () => {
        qb.reset_query();
        const sql = qb.from(['galaxies','star_systems','planets']).delete();
        sql.should.eql("DELETE FROM [galaxies]");
    });
    it('should add where conditions to where_array when conditions are supplied', () => {
        qb.reset_query();
        qb.delete('planets', {continents: 7, star_system: 'Solar'});
        qb.where_array.should.eql(["[continents] = 7", "AND [star_system] = 'Solar'"]);
    });
    it('should return a string', () => {
        qb.reset_query();
        const sql = qb.delete('galaxies', {continents: 7, star_system: 'Solar'});
        expect(sql).to.be.a('string');
        expect(sql).to.exist;
        expect(sql).to.not.eql('');
    });
    it('should build a properly-escaped delete statement that deletes all records in a table if only a table is given', () => {
        qb.reset_query();
        const sql = qb.delete('galaxies');
        sql.should.eql('DELETE FROM [galaxies]');
    });
    it('should build a properly-escaped delete statement that deletes all records in a table that matched passed conditions', () => {
        qb.reset_query();
        const sql = qb.delete('galaxies', {class: 'M'});
        sql.should.eql("DELETE FROM [galaxies] WHERE [class] = 'M'");
    });
    it('should use ONLY the FIRST table added previously via the from() method', () => {
        qb.reset_query();
        qb.from('galaxies');
        let sql = qb.delete();
        sql.should.eql('DELETE FROM [galaxies]');

        qb.reset_query();
        sql = qb.from(['galaxies','star_systems','planets']).delete();
        sql.should.eql('DELETE FROM [galaxies]');
    });
    it('should accept where conditions added previously via the where() method', () => {
        qb.reset_query();
        const sql = qb.where('created >=',4.6E9).where({class: 'M'}).delete('galaxies');
        sql.should.eql("DELETE FROM [galaxies] WHERE [created] >= 4600000000 AND [class] = 'M'");
    });
    it('should accept a limit on the number of rows deleted', () => {
        qb.reset_query();
        const sql = qb.limit(20).delete('galaxies');
        sql.should.eql("DELETE TOP (20) FROM [galaxies]");
    });
    it('should not a allow an offset delete', () => {
        qb.reset_query();
        expect(() => qb.limit(20, 10).delete('galaxies'), 'offset provided').to.throw(Error);
    });
});
