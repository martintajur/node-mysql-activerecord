const should = require('chai').should();
const expect = require('chai').expect;
const configs = require('configs');

const QueryBuilder = require('../../index.js');
const my_pool = new QueryBuilder(configs.mysql, 'mysql', 'pool');
const ms_pool = new QueryBuilder(configs.mssql, 'mssql', 'pool');

describe('Multiple Drivers', () => {
    it('should not get confused between pools from different drivers', done => {
        pool.get_connection(qb => {
            qb.limit(1).delete('cities', (err, result) => {
                qb.select(['city', 'state_code']).from('cities').limit(1).get((err2, result2) => {
                    qb.release();
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
