const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mssql/query_builder.js');
const qb = new QueryBuilder();

describe('MSSQL: get_compiled_select()', () => {
    it('should exist', () => {
        should.exist(qb.get_compiled_select);
    });
    it('should be a function', () => {
        qb.get_compiled_select.should.be.a('function');
    });
    it('should add a table to from_array when a table is supplied', () => {
        qb.reset_query();
        qb.get_compiled_select('galaxies');
        qb.from_array.should.eql(['[galaxies]']);
    });
    it('should add a set of tables to from_array when an array of tables is supplied', () => {
        qb.reset_query();
        qb.get_compiled_select(['galaxies','star_systems','planets']);
        qb.from_array.should.eql(['[galaxies]','[star_systems]','[planets]']);
    });
    it('should return a SQL string', () => {
        qb.reset_query();
        const sql = qb.get_compiled_select('galaxies');
        sql.should.eql('SELECT * FROM [galaxies]');
    });
});

describe('MSSQL: get_compiled_insert()', () => {
    it('should exist', () => {
        should.exist(qb.get_compiled_insert);
    });
    it('should be a function', () => {
        qb.get_compiled_insert.should.be.a('function');
    });
    it('should return a SQL string', () => {
        qb.reset_query();
        const sql = qb.set({foo:'bar'}).get_compiled_insert('galaxies');
        sql.should.eql("INSERT INTO [galaxies] ([foo]) VALUES ('bar')");
    });
});

describe('MSSQL: get_compiled_update()', () => {
    it('should exist', () => {
        should.exist(qb.get_compiled_update);
    });
    it('should be a function', () => {
        qb.get_compiled_update.should.be.a('function');
    });
    it('should return a SQL string', () => {
        qb.reset_query();
        const sql = qb.set({foo:'bar'}).where('id',45).get_compiled_update('galaxies');
        sql.should.eql("UPDATE [galaxies] SET [foo] = 'bar' WHERE [id] = 45");
    });
});

describe('MSSQL: get_compiled_delete()', () => {
    it('should exist', () => {
        should.exist(qb.get_compiled_delete);
    });
    it('should be a function', () => {
        qb.get_compiled_delete.should.be.a('function');
    });
    it('should return a SQL string', () => {
        qb.reset_query();
        const sql = qb.where('id',45).get_compiled_delete('galaxies');
        sql.should.eql("DELETE FROM [galaxies] WHERE [id] = 45");
    });
});
