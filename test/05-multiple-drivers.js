const should = require('chai').should();
const expect = require('chai').expect;
const configs = require('./configs');

const QueryBuilder = require('../index.js');
const my_pool = new QueryBuilder(configs.mysql, 'mysql', 'pool');
const ms_pool = new QueryBuilder(configs.mssql, 'mssql', 'pool');
let my_pool_settings, ms_pool_settings;

const compare_connections = (done) => {
    try {
        expect(my_pool_settings, 'should have port property').to.have.property('port');
        expect(ms_pool_settings, 'should have connection_settings property').to.have.property('connection_settings');

        const port1 = my_pool_settings.port;
        const port2 = ms_pool_settings.connection_settings.options.port;

        port1.should.not.be.eql(port2);

        done();
    } catch(e) {
        done(e);
    }
};

describe('Multiple Drivers', () => {
    it('should not get confused by what pool/settings to use', done => {
        let connections_established = 0;

        my_pool.get_connection(qb1 => {
            my_pool_settings = qb1.connection_settings();
            connections_established++;
            if (connections_established >= 2) compare_connections(done);
        });
        ms_pool.get_connection(qb2 => {
            ms_pool_settings = qb2.connection_settings();
            connections_established++;
            if (connections_established >= 2) compare_connections(done);
        });
    });
});
