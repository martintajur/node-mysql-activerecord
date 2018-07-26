const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../index.js');
const settings = require('../configs').mssql;
const driver = 'mssql';

const check = (done, f) => {
    try {
        f();
        done();
    } catch(e) {
        done(e);
    }
};

describe('MSSQL: Query Responses', () => {
    it('should allow us to execute a simple SELECT query', done => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        qb.connect(err => {
            expect(err).to.not.be.instanceof(Error);

            qb.like('city', 'Z', 'right').get_where('cities', {state_code: 'FL'}, (err, res) => {
                check(done, () => {
                    expect(err, 'there should not be an error when querying').to.not.be.instanceof(Error);
                    expect(res, 'results should not be empty').to.not.be.empty;
                    expect(res, 'should have 3 results').to.have.length(3);

                    const expected_result = [{city: 'Zellwood', state_code: 'FL'},{city: 'Zephyrhills', state_code: 'FL'},{city: 'Zolfo Springs', state_code: 'FL'}];
                    expect(res, 'should be just an array of objects representing the desired rows and columns').to.eql(expected_result);
                });
            });
        });
    });
    it('should have a javascript Standard Error object when running an invalid query', done => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        qb.connect(err => {
            expect(err).to.not.be.instanceof(Error);

            qb.query("select * = 'FL'", (err, res) => {
                check(done, () => {
                    expect(err, 'there should be an error when the query is invalid').to.be.instanceof(Error);
                });
            });
        });
    });
    it('should respond with an object explaining the results of an INSERT query', done => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        qb.connect(err => {
            expect(err).to.not.be.instanceof(Error);

            qb.insert('cities', {city: 'Node QueryBuilder', state_code: 'NQ'}, (err, res) => {
                check(done, () => {
                    expect(err, 'there should not be an error when querying').to.not.be.instanceof(Error);
                    expect(res, 'results should be an object with all the expected keys').to.be.an('object').that.includes.all.keys('insert_id', 'affected_rows', 'changed_rows');
                    expect(res.insert_id, 'insert id should be null').to.be.null;
                    expect(res.affected_rows, 'affected_rows should be 1').to.eql(1);
                    expect(res.changed_rows, 'changed_rows should be 0').to.eql(0);
                });
            });
        });
    });
    it('should respond with the requested IDs (from the `returning()` method) after insert', done => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        qb.connect(err => {
            expect(err, 'there should not be an error when querying').to.not.be.instanceof(Error);
            qb.returning(['city', 'state_code']).insert('cities', {city: 'Node QB Returns', state_code: 'NQ'}, (err, res) => {
                check(done, () => {
                    expect(res, 'results should be an object with all the expected keys').to.be.an('object').that.includes.all.keys('insert_id', 'affected_rows', 'changed_rows');
                    expect(res.insert_id, 'insert id should be the values of the ids requested').to.not.be.null;
                    expect(res.affected_rows, 'affected_rows should be 1').to.eql(1);
                    expect(res.changed_rows, 'changed_rows should be 0').to.eql(0);
                });
            });
        });
    });
    it('should respond with an object explaining the results of an UPDATE query', done => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        qb.connect(err => {
            expect(err).to.not.be.instanceof(Error);

            qb.update('cities', {city: 'Node Query Builder'}, {state_code: 'NQ'}, (err, res) => {
                check(done, () => {
                    expect(err, 'there should not be an error when querying').to.not.be.instanceof(Error);
                    expect(res, 'results should be an object with all the expected keys').to.be.an('object').that.includes.all.keys('insert_id', 'affected_rows', 'changed_rows');
                    expect(res.insert_id, 'insert id should be null').to.be.null;
                    expect(res.affected_rows, 'affected_rows should be 1').to.gte(1);
                    expect(res.changed_rows, 'changed_rows should be 1').to.gte(1);
                });
            });
        });
    });
    it('should respond with an object explaining the results of a DELETE query', done => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        qb.connect(err => {
            expect(err).to.not.be.instanceof(Error);

            qb.delete('cities', {state_code: 'NQ'}, (err, res) => {
                check(done, () => {
                    expect(err, 'there should not be an error when querying').to.not.be.instanceof(Error);
                    expect(res, 'results should be an object with all the expected keys').to.be.an('object').that.includes.all.keys('insert_id', 'affected_rows', 'changed_rows');
                    expect(res.insert_id, 'insert id should be null').to.be.null;
                    expect(res.affected_rows, 'affected_rows should be 1').to.gte(1);
                    expect(res.changed_rows, 'changed_rows should be 0').to.eql(0);
                });
            });
        });
    });
});
