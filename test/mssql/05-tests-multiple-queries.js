const should = require('chai').should();
const expect = require('chai').expect;
const settings = {
    host: 'localhost',
    database: 'mock_db',
    user: 'travis',
    password: 'Password123',
    version: '4.1.0',
    port: 1433,
    options: {
        encrypt: false
    }
};
const QueryBuilder = require('../../index.js');
const pool = new QueryBuilder(settings, 'mssql', 'pool');

describe('Multiple Queries', () => {
    it('should not get confused about table after deleting records', done => {
        pool.get_connection(qb => {
            qb.limit(1).delete('cities', (err, result) => {
                qb.select(['city', 'state_code']).from('cities').limit(1).get((err2, result2) => {
                    qb.release();
                    //console.log("Error: ", err);
                    expect(err, 'should not error on delete').to.not.be.instanceof(Error);
                    expect(result.affectedRows, 'one record should be deleted').to.be.eql(1);
                    expect(err2, 'should not error on select').to.not.be.instanceof(Error);
                    expect(result2.length, 'should have one result').to.be.equal(1);
                    done();
                });
            });
        });
    });
});
