const should = require('chai').should();
const expect = require('chai').expect;
const settings = require('../configs').mysql;
const QueryBuilder = require('../../index.js');
const pool1 = new QueryBuilder(settings, 'mysql', 'pool');
const pool2 = new QueryBuilder(Object.assign({}, settings, {database: 'mock_db2'}), 'mysql', 'pool');
let pool1_settings, pool2_settings;

const compare_connections = (done) => {
    try {
        const db1 = pool1_settings.database;
        const db2 = pool2_settings.database;
        db1.should.not.be.eql(db2);
        done();
    } catch(e) {
        done(e);
    }
};

describe('MySQL: Multiple Pools', () => {
    it('should not get confused by what pool settings to use', done => {
        let connections_established = 0;

        pool1.get_connection(qb1 => {
            pool1_settings = qb1.connection_settings();
            connections_established++;
            if (connections_established >= 2) compare_connections(done);
        });
        pool2.get_connection(qb2 => {
            pool2_settings = qb2.connection_settings();
            connections_established++;
            if (connections_established >= 2) compare_connections(done);
        });
    });
});
