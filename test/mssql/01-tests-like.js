const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mssql/query_builder.js');
const qb = new QueryBuilder();

describe('MSSQL: like()', () => {
    it('should exist', () => {
        should.exist(qb.like);
    });
    it('should be a function', () => {
        qb.like.should.be.a('function');
    });
    it('should require first parameter to be a valid string or object with key value pairs', () => {
        expect(() => qb.like(), 'nothing provided').to.throw(Error);
        expect(() => qb.like(null), 'null provided').to.throw(Error);
        expect(() => qb.like(false), 'false provided').to.throw(Error);
        expect(() => qb.like(true), 'true provided').to.throw(Error);
        expect(() => qb.like({}), 'empty object provided').to.throw(Error);
        expect(() => qb.like(3), 'integer provided').to.throw(Error);
        expect(() => qb.like(3.5), 'float provided').to.throw(Error);
        expect(() => qb.like([]), 'empty array provided').to.throw(Error);
        expect(() => qb.like(''), 'empty string provided').to.throw(Error);

        expect(() => qb.like('planet_name','ear','after'), 'valid string').to.not.throw(Error);
        expect(() => qb.like({planet_name: 'ear'}), 'valid object').to.not.throw(Error);
    });
    it('should require second parameter if first paramter is a string', () => {
        expect(() => qb.like('planet_name'), 'no second param provided').to.throw(Error);
        expect(() => qb.like('planet_name','ear'), 'valid second param provided').to.not.throw(Error);
        expect(() => qb.like({planet_name: 'ear'}), 'object provided as first param').to.not.throw(Error);
    });
    it('should require second parameter (when provided) to be a string, number, or boolean', () => {
        expect(() => qb.like('planet_name',null), 'null provided').to.throw(Error);
        expect(() => qb.like('planet_name',{}), 'empty object provided').to.throw(Error);
        expect(() => qb.like('planet_name',[]), 'empty array provided').to.throw(Error);
        expect(() => qb.like('planet_name',NaN), 'empty array provided').to.throw(Error);
        expect(() => qb.like('planet_name',Infinity), 'empty array provided').to.throw(Error);

        expect(() => qb.like('planet_name',false), 'false provided').to.not.throw(Error);
        expect(() => qb.like('planet_name',true), 'true provided').to.not.throw(Error);
        expect(() => qb.like('planet_name',3), 'integer provided').to.not.throw(Error);
        expect(() => qb.like('planet_name',3.5), 'float provided').to.not.throw(Error);
        expect(() => qb.like('planet_name',''), 'empty string provided').to.not.throw(Error);
        expect(() => qb.like('planet_name','ear'), 'non-empty string provided').to.not.throw(Error);
    });
    it('should only accept the following direction strings in the third parameter: undefined, "both", "right", "left", "before", "after"', () => {
        expect(() => qb.like('galaxy_name','milk',null), 'null provided').to.throw(Error);
        expect(() => qb.like('galaxy_name','milk',{}), 'empty object provided').to.throw(Error);
        expect(() => qb.like('galaxy_name','milk',[]), 'empty array provided').to.throw(Error);
        expect(() => qb.like('galaxy_name','milk',NaN), 'empty array provided').to.throw(Error);
        expect(() => qb.like('galaxy_name','milk',Infinity), 'empty array provided').to.throw(Error);
        expect(() => qb.like('galaxy_name','milk',false), 'false provided').to.throw(Error);
        expect(() => qb.like('galaxy_name','milk',true), 'true provided').to.throw(Error);
        expect(() => qb.like('galaxy_name','milk',3), 'integer provided').to.throw(Error);
        expect(() => qb.like('galaxy_name','milk',3.5), 'float provided').to.throw(Error);
        expect(() => qb.like('galaxy_name','milk',''), 'empty string provided').to.throw(Error);
        expect(() => qb.like('galaxy_name','milk','foo'), 'non-empty string provided').to.throw(Error);

        expect(() => qb.like('galaxy_name','milk'), 'no third param provided').to.not.throw(Error);
        expect(() => qb.like('galaxy_name','milk','right'), 'right as third param').to.not.throw(Error);
        expect(() => qb.like('galaxy_name','milk','left'), 'left as third param').to.not.throw(Error);
        expect(() => qb.like('galaxy_name','milk','both'), 'both as third param').to.not.throw(Error);
        expect(() => qb.like('galaxy_name','milk','before'), 'before as third param').to.not.throw(Error);
        expect(() => qb.like('galaxy_name','milk','after'), 'after as third param').to.not.throw(Error);
    });
    it('should put percentage signs on the right side of the condition if "right" or "after" are passed as the 3rd parameter', () => {
        qb.reset_query();
        qb.like('galaxy_name', 'milky', 'after');
        qb.where_array.should.eql(["[galaxy_name] LIKE 'milky%'"]);

        qb.reset_query();
        qb.like('galaxy_name', 'milky', 'right');
        qb.where_array.should.eql(["[galaxy_name] LIKE 'milky%'"]);
    });
    it('should put percentage signs on the left side of the condition if "before" or "left" are passed as the 3rd parameter', () => {
        qb.reset_query();
        qb.like('galaxy_name', 'milky', 'before');
        qb.where_array.should.eql(["[galaxy_name] LIKE '%milky'"]);

        qb.reset_query();
        qb.like('galaxy_name', 'milky', 'left');
        qb.where_array.should.eql(["[galaxy_name] LIKE '%milky'"]);
    });
    it('should put percentage signs on both sides of the condition if "both" or undefined are passed as the 3rd parameter', () => {
        qb.reset_query();
        qb.like('galaxy_name', 'milky');
        qb.where_array.should.eql(["[galaxy_name] LIKE '%milky%'"]);

        qb.reset_query();
        qb.like('galaxy_name', 'milky', 'both');
        qb.where_array.should.eql(["[galaxy_name] LIKE '%milky%'"]);
    });
    it('should put AND in between multiple LIKE clauses', () => {
        qb.reset_query();
        qb.like('galaxy_name', 'milky');
        qb.like('planet_name', 'ear', 'right');
        qb.where_array.should.eql(["[galaxy_name] LIKE '%milky%'", "AND [planet_name] LIKE 'ear%'"]);
    });
    it('should be chainable', () => {
        qb.reset_query();
        qb.like('galaxy_name', 'milky').like('planet_name', 'ear', 'right');
        qb.where_array.should.eql(["[galaxy_name] LIKE '%milky%'", "AND [planet_name] LIKE 'ear%'"]);
    });
    it('should not allow apostrophes in the query', () => {
        qb.reset_query();
        qb.like('galaxy_name', "O'Conner", 'both');
        qb.where_array.should.eql(["[galaxy_name] LIKE '%O''Conner%'"]);
    });
});

describe('MSSQL: or_like()', () => {
    it('should exist', () => {
        should.exist(qb.or_like);
    });
    it('should be a function', () => {
        qb.or_like.should.be.a('function');
    });
    it('should put OR in between multiple OR LIKE clauses', () => {
        qb.reset_query();
        qb.or_like('galaxy_name', 'milky');
        qb.or_like('planet_name', 'ear', 'right');
        qb.where_array.should.eql(["[galaxy_name] LIKE '%milky%'", "OR [planet_name] LIKE 'ear%'"]);
    });
    it('should be chainable', () => {
        qb.reset_query();
        qb.or_like('galaxy_name', 'milky').or_like('planet_name', 'ear', 'right');
        qb.where_array.should.eql(["[galaxy_name] LIKE '%milky%'", "OR [planet_name] LIKE 'ear%'"]);
    });
    it('should be chainable with regular like clauses', () => {
        qb.reset_query();
        qb.like('galaxy_name', 'milky').like('planet_name', 'ear', 'right').or_like('planet_name','Jup','right');
        qb.where_array.should.eql(["[galaxy_name] LIKE '%milky%'", "AND [planet_name] LIKE 'ear%'", "OR [planet_name] LIKE 'Jup%'"]);
    });
});

describe('MSSQL: not_like()', () => {
    it('should exist', () => {
        should.exist(qb.not_like);
    });
    it('should be a function', () => {
        qb.not_like.should.be.a('function');
    });
    it('should put NOT before LIKE', () => {
        qb.reset_query();
        qb.not_like('galaxy_name', 'milky');
        qb.where_array.should.eql(["[galaxy_name] NOT LIKE '%milky%'"]);
    });
    it('should put AND in between multiple NOT LIKE clauses', () => {
        qb.reset_query();
        qb.not_like('galaxy_name', 'milky');
        qb.not_like('planet_name', 'ear', 'right');
        qb.where_array.should.eql(["[galaxy_name] NOT LIKE '%milky%'", "AND [planet_name] NOT LIKE 'ear%'"]);
    });
    it('should be chainable', () => {
        qb.reset_query();
        qb.not_like('galaxy_name', 'milky').not_like('planet_name', 'ear', 'right');
        qb.where_array.should.eql(["[galaxy_name] NOT LIKE '%milky%'", "AND [planet_name] NOT LIKE 'ear%'"]);
    });
    it('should be chainable with regular like clauses', () => {
        qb.reset_query();
        qb.like('galaxy_name', 'milky').not_like('planet_name', 'ear', 'right')
        qb.where_array.should.eql(["[galaxy_name] LIKE '%milky%'", "AND [planet_name] NOT LIKE 'ear%'"]);
    });
});

describe('MSSQL: or_not_like()', () => {
    it('should exist', () => {
        should.exist(qb.or_not_like);
    });
    it('should be a function', () => {
        qb.or_not_like.should.be.a('function');
    });
    it('should put NOT before LIKE', () => {
        qb.reset_query();
        qb.or_not_like('galaxy_name', 'milky');
        qb.where_array.should.eql(["[galaxy_name] NOT LIKE '%milky%'"]);
    });
    it('should put OR in between multiple NOT LIKE clauses', () => {
        qb.reset_query();
        qb.or_not_like('galaxy_name', 'milky');
        qb.or_not_like('planet_name', 'ear', 'right');
        qb.where_array.should.eql(["[galaxy_name] NOT LIKE '%milky%'", "OR [planet_name] NOT LIKE 'ear%'"]);
    });
    it('should be chainable', () => {
        qb.reset_query();
        qb.or_not_like('galaxy_name', 'milky').or_not_like('planet_name', 'ear', 'right');
        qb.where_array.should.eql(["[galaxy_name] NOT LIKE '%milky%'", "OR [planet_name] NOT LIKE 'ear%'"]);
    });
    it('should be chainable with regular like clauses', () => {
        qb.reset_query();
        qb.like('galaxy_name', 'milky').like('galaxy_name', 'meda', 'before').or_not_like('planet_name', 'ear', 'right')
        qb.where_array.should.eql(["[galaxy_name] LIKE '%milky%'", "AND [galaxy_name] LIKE '%meda'", "OR [planet_name] NOT LIKE 'ear%'"]);
    });
});
