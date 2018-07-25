const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mssql/query_builder.js');
const qb = new QueryBuilder();

describe('MSSQL: get()', () => {
    it('should exist', () => {
        should.exist(qb.get);
    });
    it('should be a function', () => {
        qb.get.should.be.a('function');
    });
    it('should add a table to from_array when a table is supplied', () => {
        qb.reset_query();
        qb.get('galaxies');
        qb.from_array.should.eql(['[galaxies]']);
    });
    it('should add a set of tables to from_array when an array of tables is supplied', () => {
        qb.reset_query();
        qb.get(['galaxies','star_systems','planets']);
        qb.from_array.should.eql(['[galaxies]','[star_systems]','[planets]']);
    });
    it('should not accept anything but a non-empty string or an array of non-empty strings', () => {
        qb.reset_query();
        expect(() => qb.get(),                        'nothing provided').to.throw(Error);
        expect(() => qb.get({foo: 'bar'}),            'object provided').to.throw(Error);
        expect(() => qb.get(true),                    'boolean provided').to.throw(Error);
        expect(() => qb.get(NaN),                     'NaN provided').to.throw(Error);
        expect(() => qb.get(null),                    'NULL provided').to.throw(Error);
        expect(() => qb.get(1),                       'Integer provided').to.throw(Error);
        expect(() => qb.get(1.1),                     'Float provided').to.throw(Error);
        expect(() => qb.get(1.1),                     'Float provided').to.throw(Error);
        expect(() => qb.get([]),                      'Empty array provided').to.throw(Error);
        expect(() => qb.get(''),                      'Empty string provided').to.throw(Error);
        expect(() => qb.get('galaxies'),              'Valid string provided').to.not.throw(Error);
        expect(() => qb.get(['galaxies','planets']),  'Array of non-empty strings provided').to.not.throw(Error);
    });
    it('should return a string', () => {
        qb.reset_query();
        const sql = qb.get('galaxies');
        expect(sql).to.be.a('string');
        expect(sql).to.exist;
        expect(sql).to.not.eql('');
    });
    it('should build a properly-escaped SELECT statement that retrieves all records in a table if only a table is given', () => {
        qb.reset_query();
        const sql = qb.get('galaxies');
        sql.should.eql('SELECT * FROM [galaxies]');
    });
    it('should properly handle alias if provided in table string', () => {
        qb.reset_query();
        const sql = qb.get('galaxies g');
        sql.should.eql('SELECT * FROM [galaxies] [g]');
    });
    it('should build a properly-escaped SELECT statement that retrieves all fields specified from a table', () => {
        qb.reset_query();
        const sql = qb.select(['id','name']).get('galaxies');
        sql.should.eql("SELECT [id], [name] FROM [galaxies]");
    });
    it('should build a properly-escaped SELECT statement that retrieves all records in a table that match passed WHERE conditions', () => {
        qb.reset_query();
        const sql = qb.where('class','M').get('galaxies');
        sql.should.eql("SELECT * FROM [galaxies] WHERE [class] = 'M'");
    });
    it('should build a properly-escaped SELECT statement that retrieves all records from a set of joined tables if an array of tables is given', () => {
        qb.reset_query();
        const sql = qb.get(['galaxies','star_systems','planets']);
        sql.should.eql('SELECT * FROM [galaxies], [star_systems], [planets]');
    });
    it('should build a properly-escaped SELECT statement that retrieves all records in a set of tables that match the passed conditions', () => {
        qb.reset_query();
        const sql = qb.where('class', 'M').get(['galaxies','star_systems','planets']);
        sql.should.eql("SELECT * FROM [galaxies], [star_systems], [planets] WHERE [class] = 'M'");
    });
    it('should use tables added previously via the from() method', () => {
        qb.reset_query();
        qb.from('galaxies');
        let sql = qb.get();
        sql.should.eql('SELECT * FROM [galaxies]');

        qb.reset_query();
        sql = qb.from(['galaxies','star_systems','planets']).get();
        sql.should.eql('SELECT * FROM [galaxies], [star_systems], [planets]');
    });
    it('should accept where conditions added previously via the where() method', () => {
        qb.reset_query();
        const sql = qb.where('created >=',4.6E9).where({classification: 'M'}).get('galaxies');
        sql.should.eql("SELECT * FROM [galaxies] WHERE [created] >= 4600000000 AND [classification] = 'M'");
    });
    it('should accept a limit on the number of rows selected', () => {
        qb.reset_query();
        const sql = qb.limit(20).get('galaxies');
        sql.should.eql("SELECT TOP (20) * FROM [galaxies]");
    });
    it('should accept a LIMIT on the number of rows to select and an OFFSET at which to start selecting the rows', () => {
        qb.reset_query();
        const sql = qb.limit(20, 10).get('galaxies');
        sql.should.eql("SELECT * FROM [galaxies] ORDER BY (SELECT NULL) OFFSET 10 ROWS FETCH NEXT 20 ROWS ONLY");
    });
    it('should accept a LIMIT on the number of rows to select and an OFFSET at which to start selecting the rows while retaining the proper order', () => {
        qb.reset_query();
        const sql = qb.order_by('name','asc').limit(20, 10).get('galaxies');
        sql.should.eql("SELECT * FROM [galaxies] ORDER BY [name] ASC OFFSET 10 ROWS FETCH NEXT 20 ROWS ONLY");
    });
    it('should include the DISTINCT keyword if the distinct() method is called', () => {
        qb.reset_query();
        const sql = qb.distinct().select(['id','name']).get('galaxies');
        sql.should.eql("SELECT DISTINCT [id], [name] FROM [galaxies]");
    });
    it('should include the MIN, MAX, AVG, or SUM aggregation methods in the select statement if provided', () => {
        qb.reset_query();

        // MIN
        let sql = qb.select_min('size','min_size').get('galaxies');
        sql.should.eql("SELECT MIN([size]) AS min_size FROM [galaxies]");
        qb.reset_query();

        // MAX
        sql = qb.select_max('size','max_size').get('galaxies');
        sql.should.eql("SELECT MAX([size]) AS max_size FROM [galaxies]");
        qb.reset_query();

        // AVG
        sql = qb.select_avg('size','avg_size').get('galaxies');
        sql.should.eql("SELECT AVG([size]) AS avg_size FROM [galaxies]");
        qb.reset_query();

        // SUM
        sql = qb.select_sum('size','total_size').get('galaxies');
        sql.should.eql("SELECT SUM([size]) AS total_size FROM [galaxies]");
    });
    it('should include any joins that were added in the chain', () => {
        qb.reset_query();
        const sql = qb.select(['s.name as star_system_name', 'g.name as galaxy_name'])
            .join('galaxies g','g.id=s.galaxy_id','left')
            .get('star_systems s');
        sql.should.eql("SELECT [s].[name] as [star_system_name], [g].[name] as [galaxy_name] FROM [star_systems] [s] LEFT JOIN [galaxies] [g] ON [g].[id] = [s].[galaxy_id]");
    });
    it('should include any GROUP BY statements added using the group_by() method.', () => {
        qb.reset_query();
        const sql = qb.select('size').select('COUNT(id) as [num_of_size]',false).group_by('size').get('galaxies');
        sql.should.eql("SELECT [size], COUNT(id) AS [num_of_size] FROM [galaxies] GROUP BY [size]");
    });
    it('should add the ORDER BY clause of the order_by() method was called in the chain', () => {
        qb.reset_query();
        const sql = qb.order_by('size').get('galaxies');
        sql.should.eql("SELECT * FROM [galaxies] ORDER BY [size] ASC");
    });
    it('should include any HAVING clauses added using the having() method', () => {
        qb.reset_query();
        const sql = qb.select('size').select('COUNT(id) as [num_of_size]',false).group_by('size').having('num_of_size >=',456034960).get('galaxies');
        sql.should.eql("SELECT [size], COUNT(id) AS [num_of_size] FROM [galaxies] GROUP BY [size] HAVING [num_of_size] >= 456034960");
    });
});

describe('MSSQL: get_where()', () => {
    it('should exist', () => {
        should.exist(qb.get_where);
    });
    it('should be a function', () => {
        qb.get_where.should.be.a('function');
    });
    it('should require the first parameter to be a table in string format or tables array format', () => {
        qb.reset_query();
        expect(() => qb.get_where(), 'nothing provided').to.throw(Error);
        expect(() => qb.get_where(''), 'empty string for table').to.throw(Error);
        expect(() => qb.get_where([]), 'empty array for tables').to.throw(Error);
        expect(() => qb.get_where(['']), 'array of empty strings for tables').to.throw(Error);
        expect(() => qb.get_where(1), 'integer for table').to.throw(Error);
        expect(() => qb.get_where(5.5), 'float for table').to.throw(Error);
        expect(() => qb.get_where(true), 'TRUE for table').to.throw(Error);
        expect(() => qb.get_where(false), 'FALSE for table').to.throw(Error);
        expect(() => qb.get_where(null), 'NULL for table').to.throw(Error);
        expect(() => qb.get_where({}), 'Standard object for table').to.throw(Error);
        expect(() => qb.get_where(Infinite), 'Infinite for table').to.throw(Error);
        expect(() => qb.get_where('galaxies'), 'valid table, no where').to.throw(Error);
        expect(() => qb.get_where('galaxies',{}), 'valid table, empty where').to.throw(Error);
        expect(() => qb.get_where('galaxies',[]), 'valid table, array for where').to.throw(Error);
        expect(() => qb.get_where('galaxies',3), 'valid table, integer for where').to.throw(Error);
        expect(() => qb.get_where('galaxies',33.3), 'valid table, float for where').to.throw(Error);
        expect(() => qb.get_where('galaxies','foo'), 'valid table, string for where').to.throw(Error);
        expect(() => qb.get_where('galaxies',true), 'valid table, TRUE for where').to.throw(Error);
        expect(() => qb.get_where('galaxies',false), 'valid table, FALSE for where').to.throw(Error);
        expect(() => qb.get_where('galaxies',Infinite), 'valid table, Infinite where').to.throw(Error);
        expect(() => qb.get_where('galaxies',null), 'valid table, NULL where').to.throw(Error);
        expect(() => qb.get_where('galaxies',{id: 3}), 'valid table, valid where').to.not.throw(Error);
    });
    it('should return a string', () => {
        qb.reset_query();
        const sql = qb.get('galaxies', {type: 'spiral'});
        expect(sql).to.be.a('string');
        expect(sql).to.exist;
        expect(sql).to.not.eql('');
    });
    it('should add table(s) to from_array and where items to where_array', () => {
        qb.reset_query();
        const sql = qb.get_where('galaxies', {type: 'spiral'});
        qb.from_array.should.eql(['[galaxies]']);
        qb.where_array.should.eql(["[type] = 'spiral'"]);
        sql.should.eql("SELECT * FROM [galaxies] WHERE [type] = 'spiral'");
    });
});
