const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../index.js');
const settings = require('../configs').mysql;
const driver = 'mysql';

const check = (done, f) => {
    try {
        f();
        done();
    } catch(e) {
        done(e);
    }
};

describe('MySQL: Query Responses', () => {
    it('should allow us to execute a simple SELECT query', async () => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        try {
            await qb.connect();
            const res = await qb.query("select * from `cities` where `city` like 'Z%' and `state_code` = 'FL'");

            expect(res, 'results should not be empty').to.not.be.empty;
            expect(res, 'should have 3 results').to.have.length(3);
        } catch (err) {
            throw err;
        } finally {

        }
    });
    it('should have a non-empty array of objects as a response value when there should be results from a SELECT query', async () => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        try {
            await qb.connect();
            const res = await qb.like('city', 'Z', 'right').get_where('cities', { state_code: 'FL' });

            expect(res, 'results should not be empty').to.not.be.empty;
            expect(res, 'should have 3 results').to.have.length(3);
        } catch (err) {
            throw err;
        } finally {

        }
    });
    it('should have a javascript Standard Error object when running an invalid query', async () => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        
        await qb.connect();

        try {
            await qb.query("select * = 'FL'");
        } catch (err) {
            expect(err, 'there should be an error when the query is invalid').to.be.instanceof(Error);
        } finally {

        }
    });
    it('should respond with an object explaining the results of an INSERT query', async () => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        try {
            await qb.connect();
            const res = await qb.insert('cities', { city: 'Node QueryBuilder', state_code: 'NQ' });

            expect(res, 'results should be an object with all the expected keys').to.be.an('object').that.includes.all.keys('insert_id', 'affected_rows', 'changed_rows');
            expect(res.insert_id, 'insert id should be null').to.be.null;
            expect(res.affected_rows, 'affected_rows should be 1').to.eql(1);
            expect(res.changed_rows, 'changed_rows should be 0').to.eql(0);
        } catch (err) {
            throw err;
        } finally {

        }
    });
    it('should respond with an object explaining the results of an UPDATE query', async () => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        try {
            await qb.connect();
            const res = await qb.update('cities', { city: 'Node Query Builder' }, { state_code: 'NQ' });

            expect(res, 'results should be an object with all the expected keys').to.be.an('object').that.includes.all.keys('insert_id', 'affected_rows', 'changed_rows');
            expect(res.insert_id, 'insert id should be null').to.be.null;
            expect(res.affected_rows, 'affected_rows should be 1').to.gte(1);
            expect(res.changed_rows, 'changed_rows should be 1').to.gte(1);
        } catch (err) {
            throw err;
        } finally {

        }
    });
    it('should respond with an object explaining the results of a DELETE query', async () => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        try {
            await qb.connect();
            const res = await qb.delete('cities', { state_code: 'NQ' });

            expect(res, 'results should be an object with all the expected keys').to.be.an('object').that.includes.all.keys('insert_id', 'affected_rows', 'changed_rows');
            expect(res.insert_id, 'insert id should be null').to.be.null;
            expect(res.affected_rows, 'affected_rows should be 1').to.gte(1);
            expect(res.changed_rows, 'changed_rows should be 0').to.eql(0);
        } catch (err) {
            throw err;
        } finally {

        }
    });
});
