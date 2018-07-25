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

const connection_released = qb => {
    const connection = qb.connection();
    const settings = qb.connection_settings();

    //console.log("Connection Pool: ", connection.pool);

    let used_connections = connection.pool.connections.filter(v => v.status === 2).length;
    let available_connections = connection.pool.connections.filter(v => v.status !== 2).length;
    expect(used_connections, 'one used connection').to.be.eql(1);
    expect(available_connections, 'max -1 available connections').to.be.eql(settings.pool_settings.min - 1);

    qb.release();

    // Release of the connection is not really immediate... ugh...
    setTimeout(() => {
        used_connections = connection.pool.connections.filter(v => v.status === 2).length;
        available_connections = connection.pool.connections.filter(v => v.status !== 2).length;
        //console.log("Connections: ", connection.pool.connections);
        expect(used_connections, 'no used connections').to.be.eql(0);
        expect(available_connections, 'max connections available').to.be.eql(settings.pool_settings.min);
    }, 100);
};

describe('MSSQL: QueryBuilder() - Adapter', () => {
    afterEach(done => {
        // const qb = new QueryBuilder(Object.assign({}, settings), driver);
        // qb.disconnect();
        done();
   });

    const bad_user = Object.assign({}, settings, {user: 'foobar'});
    const bad_host = Object.assign({}, settings, {host: 'nonlocalhost'});
    const bad_password = Object.assign({}, settings, {password: 'password'});
    const bad_database = Object.assign({}, settings, {database: 'bad_mock_db'});
    const bad_port = Object.assign({}, settings, {port: 1});
    const bad_version = Object.assign({}, settings, {version: 12});

    it('should exist', () => {
        should.exist(QueryBuilder);
    });
    it('should be a function', () => {
        QueryBuilder.should.be.a('function');
    });
    it('should have all the QueryBuilder methods', () => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        const children = [
            'reset_query','where','or_where','_where','where_in','or_where_in','where_not_in','or_where_not_in','_where_in','like',
            'not_like','or_like','or_not_like','_like','from','join','select','select_min','select_max','select_avg','select_sum',
            '_min_max_avg_sum','distinct','group_by','having','or_having','_having','order_by','limit','offset','set','returning'
        ];
        children.forEach(v => {
            expect(qb).to.respondTo(v);
        });
    });
    it('should have all the QueryExec methods', () => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        const children = [
            'insert','insert_ignore','insert_batch','get','get_where','count','update','update_batch','delete',
            'get_compiled_select','get_compiled_delete','get_compiled_update','get_compiled_insert','compile_select',
            'compile_delete','compile_update','compile_insert'
        ];
        children.forEach(v => {
            expect(qb).to.respondTo(v);
        });
    });
    it('should have all the miscellaneous methods', () => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        const children = ['last_query','escape','empty_table','truncate'];
        children.forEach(v => {
            expect(qb).to.respondTo(v);
        });
    });
    it('should establish a single connection given valid connection credentials', done => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        expect(qb, 'should have connect property').to.have.property('connect');
        qb.connect(err => {
            check(done, () => {
                expect(err, 'should be connected').to.not.be.instanceof(Error);
            });
        });
    });
    it('should allow us to disconnect from MS SQL', done => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        qb.connect(err => {
            should.exist(qb.disconnect);
            qb.disconnect.should.be.a('function');

            qb.disconnect(err => {
                check(done, () => {
                    expect(err, 'should not have errored during disconnect process').to.not.be.instanceof(Error);
                });
            });
        });
    });


    it('should fail to establish a single connection given no parameters', () => {
        expect(() => new QueryBuilder()).to.throw(Error);
    });
    it('should fail to establish a single connection given no connection credentials', () => {
        expect(() => new QueryBuilder({},driver)).to.throw(Error);
    });
    it('should fail to establish a single connection given connection credentials with bad user', done => {
        const qb = new QueryBuilder(bad_user, driver);

        expect(qb, 'should have connect method').to.have.property('connect');

        qb.connect(err => {
            check(done, () => {
                expect(err, 'should not be connected').to.be.instanceof(Error);
            });
        });
    });
    it('should fail to establish a single connection given connection credentials with bad host', done => {
        const qb = new QueryBuilder(bad_host, driver);

        expect(qb, 'should have connect method').to.have.property('connect');

        qb.connect(err => {
            check(done, () => {
                expect(err, 'should not be connected').to.be.instanceof(Error);
            });
        });
    });
    it('should fail to establish a single connection given connection credentials with bad database', done => {
        const qb = new QueryBuilder(bad_database, driver);

        expect(qb, 'should have connect method').to.have.property('connect');

        qb.connect(err => {
            check(done, () => {
                expect(err, 'should not be connected').to.be.instanceof(Error);
            });
        });
    });
    it('should fail to establish a single connection given connection credentials with bad password', done => {
        const qb = new QueryBuilder(bad_password, driver);

        expect(qb, 'should have connect method').to.have.property('connect');

        qb.connect(err => {
            check(done, () => {
                expect(err, 'should not be connected').to.be.instanceof(Error);
            });
        });
    });
    it('should fail to establish a single connection given connection credentials with bad port', done => {
        const qb = new QueryBuilder(bad_port, driver);

        expect(qb, 'should have connect method').to.have.property('connect');

        qb.connect(err => {
            check(done, () => {
                expect(err, 'should not be connected').to.be.instanceof(Error);
            });
        });
    });
    it('should fail to establish connection if no driver is specified', () => {
        expect(() => new QueryBuilder(settings), 'no driver specified').to.throw(Error);
    });
    it('should fail to establish connection if an invalid driver is specified', () => {
        expect(() => new QueryBuilder(settings, 'foobar'), 'invalid driver specified').to.throw(Error);
    });
    it('should fail to establish connection if an invalid driver version is specified', () => {
        expect(() => new QueryBuilder(Object.assign({}, settings), driver), 'valid driver version').to.not.throw(Error);
        expect(() => new QueryBuilder(bad_version, driver), 'invalid driver version').to.throw(Error);
    });

    it('should allow us to retrieve our connection settings for reference', done => {
        const qb_settings = Object.assign({}, settings);
        const qb = new QueryBuilder(qb_settings, driver);
        qb.connect(err => {
            check(done, () => {
                should.exist(qb.connection_settings);
                qb.connection_settings.should.be.a('function');
                const all_settings = qb.connection_settings();
                const settings = all_settings.connection_settings;
                expect(settings).to.be.instanceof(Object);
                expect(settings).to.have.property('server');
                expect(settings).to.have.property('userName');
                expect(settings).to.have.property('password');
                expect(settings).to.have.property('options');
                expect(settings.options).to.have.property('database');
                expect(settings.options).to.have.property('port');
                expect(settings.server).to.be.eql(qb_settings.host);
                expect(settings.userName).to.be.eql(qb_settings.user);
                expect(settings.password).to.be.eql(qb_settings.password);
                expect(settings.options.database).to.be.eql(qb_settings.database);
            });
        });
    });
    it('should allow us to escape certain values', done => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        qb.connect(err => {
            check(done, () => {
                should.exist(qb.escape);
                qb.escape.should.be.a('function');
                expect(qb.escape(null)).to.be.eql('NULL');
                expect(qb.escape('3')).to.be.eql(3);
                expect(qb.escape(false)).to.be.eql(0);
                expect(qb.escape(true)).to.be.eql(1);
                qb.disconnect();
            });
        });
    });
    it('should allow us to escape identifiers the MS SQL way', done => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        qb.connect(err => {
            check(done, () => {
                should.exist(qb.escape_id);
                qb.escape_id.should.be.a('function');
                expect(qb.escape_id('foo'), 'not  pre-escaped').to.be.eql('[foo]');
                expect(qb.escape_id('[foo]'), 'pre-escaped').to.be.eql('[[foo]]]');
                expect(qb.escape_id('foo.bar'), 'with qualifier').to.be.eql('[foo].[bar]');
                qb.disconnect();
            });
        });
    });
    it('should allow us to execute a query', done => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        qb.connect(err => {
            expect(err).to.not.be.instanceof(Error);

            qb.query("select * from [cities] where [city] like 'Z%' and [state_code] = 'FL'", (err, res) => {
                check(done, () => {
                    expect(err, 'there should not be an error when querying').to.not.be.instanceof(Error);
                    expect(res, 'results should not be empty').to.not.be.empty;
                    expect(res, 'should have 3 results').to.have.length(3);
                });
            });
        });
    });
    it('should not be able to release a non-pooled connection', done => {
        const qb = new QueryBuilder(Object.assign({}, settings), driver);
        qb.connect(err => {
            check(done, () => {
                expect(() => qb.release()).to.throw(Error);
            });
        });
    });
    it('should create a connection pool object if asked', () => {
        const pool = new QueryBuilder(Object.assign({}, settings), driver, 'pool');
        const methods = ['pool','get_connection','disconnect'];

        expect(pool, 'pool should be object').to.be.instanceof(Object);
        methods.forEach(v => {
            expect(pool, `pool should have method: ${v}`).to.respondTo(v);
        });

        pool.pool.should.be.a('function');
        pool.get_connection.should.be.a('function');
        pool.disconnect.should.be.a('function');
    });
    it('should create a QueryBuilder adapter when getting a connection from the pool', done => {
        const qb2 = new QueryBuilder(Object.assign({}, settings), driver);
        const pool = new QueryBuilder(Object.assign({}, settings), driver, 'pool');
        pool.get_connection(qb => {
            check(done, () => {
                expect(qb2).to.include.keys(Object.keys(qb));
            });
        });
    });
    it('should allow one to release a connection from the pool', done => {
        const qb2 = new QueryBuilder(Object.assign({}, settings), driver);
        const pool = new QueryBuilder(Object.assign({}, settings), driver, 'pool');
        pool.get_connection(qb => {
            check(done, () => connection_released(qb));
        });
    });
});
