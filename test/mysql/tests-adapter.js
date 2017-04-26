var should = require('chai').should();
var expect = require('chai').expect;
var nqb = require('../../index.js');

var check = function(done, f) {
	try {
		f();
		done();
	} catch(e) {
		done(e);
	}
};

var connection_released = function(qb) {
	var connection = qb.connection();
	expect(connection._pool._freeConnections).to.have.length(0);
	qb.release();
	expect(connection._pool._freeConnections).to.have.length(1);
};

describe('QueryBuilder() - MySQL Adapter', function() {
	var on_connect = function(err) {
		if (err) { console.error("Not connected!"); return; }
		console.log("connected!");
	};
	var driver = 'mysql';
	var settings = {
		host: '127.0.0.1',
		database: 'mock_db',
		user: 'travis',
		version: '2.5.4',
		port: 3306
	};
	var bad_user = Object.assign({},settings); bad_user.user = 'foobar';
	var bad_host = Object.assign({},settings); bad_host.host = 'nonlocalhost';
	var bad_password = Object.assign({},settings); bad_password.password = 'password';
	var bad_database = Object.assign({},settings); bad_database.database = 'bad_mock_db';
	var bad_port = Object.assign({},settings); bad_port.port = 1;
	var bad_version = Object.assign({},settings); bad_version.version = 12;

	it('should exist', function() {
		should.exist(nqb.QueryBuilder);
	});
	it('should be a function', function() {
		nqb.QueryBuilder.should.be.a('function');
	});
	it('should have all the QueryBuilder methods', function() {
		var qb = nqb.QueryBuilder(Object.assign({}, settings), driver);
		var children = ['where_array','where_in_array','from_array','join_array','select_array','set_array','order_by_array','group_by_array','having_array','limit_to','offset_val','join_clause','last_query_string','distinct_clause','aliased_tables','reset_query','where','or_where','_where','where_in','or_where_in','where_not_in','or_where_not_in','_where_in','like','not_like','or_like','or_not_like','_like','from','join','select','select_min','select_max','select_avg','select_sum','_min_max_avg_sum','distinct','group_by','having','or_having','_having','order_by','limit','offset','set'];
		expect(qb).to.include.keys(children);
	});
	it('should have all the QueryExec methods', function() {
		var qb = nqb.QueryBuilder(Object.assign({}, settings), driver);
		var children = ['insert','insert_ignore','insert_batch','get','get_where','count','update','update_batch','delete','get_compiled_select','get_compiled_delete','get_compiled_update','get_compiled_insert','compile_select','compile_delete','compile_update','compile_insert'];
		expect(qb).to.include.keys(children);
	});
	it('should have all the miscellaneous methods', function() {
		var qb = nqb.QueryBuilder(Object.assign({}, settings), driver);
		var children = ['last_query','escape','empty_table','truncate'];
		expect(qb).to.include.keys(children);
	});
	it('should establish a single connection given valid connection credentials', function(done) {
		var qb = nqb.QueryBuilder(Object.assign({}, settings), driver);
		expect(qb, 'should have connect property').to.have.property('connect');
		qb.connect(function(err) {
			check(done, function() {
				expect(err, 'should be connected').to.not.be.instanceof(Error);
			});
		});
	});
	it('should allow us to disconnect from MySQL', function(done) {
		var qb = nqb.QueryBuilder(Object.assign({}, settings), driver);
		qb.connect(function(err) {
			should.exist(qb.disconnect);
			qb.disconnect.should.be.a('function');

			qb.disconnect(function(err) {
				var connection = qb.connection();

				check(done, function() {
					expect(err, 'should be diconnected').to.not.be.instanceof(Error);
					expect(connection._protocol._ended).to.be.true;
				});
			});
		});
	});


	it('should fail to establish a single connection given no parameters', function() {
		expect(function() { nqb.QueryBuilder(); }).to.throw(Error);
	});
	it('should fail to establish a single connection given no connection credentials', function() {
		expect(function() { nqb.QueryBuilder({},driver); }).to.throw(Error);
	});
	it('should fail to establish a single connection given connection credentials with bad user', function(done) {
		try {
			var qb = nqb.QueryBuilder(bad_user, driver);
		} catch(e) {
			expect(e, 'should not get a connection').to.be.instanceof(Error);
			return;
		}
		expect(qb, 'should have connect property').to.have.property('connect');
		qb.connect(function(err) {
			check(done, function() {
				expect(err, 'should not be connected').to.be.instanceof(Error);
			});
		});
	});
	it('should fail to establish a single connection given connection credentials with bad host', function(done) {
		try {
			var qb = nqb.QueryBuilder(bad_host, driver);
		} catch(e) {
			expect(e, 'should not get a connection').to.be.instanceof(Error);
			return;
		}
		expect(qb, 'should have connect property').to.have.property('connect');
		qb.connect(function(err) {
			check(done, function() {
				expect(err, 'should not be connected').to.be.instanceof(Error);
			});
		});
	});
	it('should fail to establish a single connection given connection credentials with bad database', function(done) {
		try {
			var qb = nqb.QueryBuilder(bad_database, driver);
		} catch(e) {
			expect(e, 'should not get a connection').to.be.instanceof(Error);
			return;
		}
		expect(qb, 'should have connect property').to.have.property('connect');
		qb.connect(function(err) {
			check(done, function() {
				expect(err, 'should not be connected').to.be.instanceof(Error);
			});
		});
	});
	it('should fail to establish a single connection given connection credentials with bad password', function(done) {
		try {
			var qb = nqb.QueryBuilder(bad_password, driver);
		} catch(e) {
			expect(e, 'should not get a connection').to.be.instanceof(Error);
			return;
		}
		expect(qb, 'should have connect property').to.have.property('connect');
		qb.connect(function(err) {
			check(done, function() {
				expect(err, 'should not be connected').to.be.instanceof(Error);
			});
		});
	});
	it('should fail to establish a single connection given connection credentials with bad port', function(done) {
		try {
			var qb = nqb.QueryBuilder(bad_port, driver);
		} catch(e) {
			expect(e, 'should not get a connection').to.be.instanceof(Error);
			return;
		}
		expect(qb, 'should have connect property').to.have.property('connect');
		qb.connect(function(err) {
			check(done, function() {
				expect(err, 'should not be connected').to.be.instanceof(Error);
			});
		});
	});
	it('should fail to establish connection if an invalid driver is specified', function() {
		var qb;
		expect(function() { nqb.QueryBuilder(settings);				}, 'no driver specified').to.throw(Error);
		expect(function() { nqb.QueryBuilder(settings,'foobar');	}, 'invalid driver specified').to.throw(Error);
	});
	it('should fail to establish connection if an invalid driver version is specified', function() {
		var qb;
		expect(function() { nqb.QueryBuilder( Object.assign({}, settings), driver); 	}, 'valid driver version').to.not.throw(Error);
		expect(function() { nqb.QueryBuilder(bad_version, driver);				}, 'invalid driver version').to.throw(Error);
	});

	it('should allow us to retrieve our connection settings for reference', function(done) {
		var conn_settings = Object.assign({}, settings, {password: undefined});
		delete conn_settings.version;

		var qb = nqb.QueryBuilder(Object.assign({}, settings), driver);
		qb.connect(function(err) {
			check(done, function() {
				should.exist(qb.connection_settings);
				qb.connection_settings.should.be.a('function');
				var settings = qb.connection_settings();
				expect(settings).to.be.instanceof(Object);
				expect(settings).to.be.eql(conn_settings);
				qb.disconnect();
			});
		});
	});
	it('should allow us to escape certain values', function(done) {
		var qb = nqb.QueryBuilder(Object.assign({}, settings), driver);
		qb.connect(function(err) {
			check(done, function() {
				should.exist(qb.escape);
				qb.escape.should.be.a('function');
				expect(qb.escape(null)).to.be.eql('NULL');
				expect(qb.escape('3')).to.be.eql(3);
				expect(qb.escape(false)).to.be.eql(0);
				expect(qb.escape(true)).to.be.eql(1);
				expect(qb.escape(null)).to.be.eql('NULL');
				qb.disconnect();
			});
		});
	});
	it('should allow us to escape identifiers the MySQL way', function(done) {
		var qb = nqb.QueryBuilder(Object.assign({}, settings), driver);
		qb.connect(function(err) {
			check(done, function() {
				should.exist(qb.escape_id);
				qb.escape_id.should.be.a('function');
				expect(qb.escape_id('foo'), 'not  pre-escaped').to.be.eql('`foo`');
				expect(qb.escape_id('`foo`'), 'pre-escaped').to.be.eql('```foo```');
				expect(qb.escape_id('foo.bar'), 'with qualifier').to.be.eql('`foo`.`bar`');
				qb.disconnect();
			});
		});
	});
	it('should allow us to execute a query', function(done) {
		var qb = nqb.QueryBuilder(Object.assign({}, settings), driver);
		qb.connect(function(err) {
			qb.query("select * from `cities` where `city` like 'Z%' and `state_code` = 'FL'", function(err, res) {
				check(done, function() {
					expect(err).to.not.be.instanceof(Error);
					expect(res).to.not.be.empty;
					expect(res).to.have.length(3);
				});
			});
		});
	});
	it('should not be able to release a non-pooled connection', function(done) {
		var qb = nqb.QueryBuilder(Object.assign({}, settings), driver);
		qb.connect(function(err) {
			check(done, function() {
				expect(function() { qb.release(); }).to.throw(Error);
			});
		});
	});
	it('should create a connection pool object if asked', function() {
		var pool = nqb.QueryBuilder(Object.assign({}, settings), driver, 'pool');
		expect(pool).to.be.instanceof.object;
		expect(pool).to.include.keys(['pool','get_connection','disconnect']);
		pool.pool.should.be.a('function');
		pool.get_connection.should.be.a('function');
		pool.disconnect.should.be.a('function');
	});
	it('should create a QueryBuilder adapter when getting a connection from the pool', function(done) {
		var qb2 = nqb.QueryBuilder(Object.assign({}, settings), driver);
		var pool = nqb.QueryBuilder(Object.assign({}, settings), driver, 'pool');
		pool.get_connection(function(qb) {
			check(done, function() {
				expect(qb).to.include.keys(Object.keys(qb2));
			});
		});
	});
	it('should allow one to release a connection from the pool', function(done) {
		var qb2 = nqb.QueryBuilder(Object.assign({}, settings), driver);
		var pool = nqb.QueryBuilder(Object.assign({}, settings), driver, 'pool');
		pool.get_connection(function(qb) {
			check(done, function() { connection_released(qb); });
		});
	});
	it('should allow one use the same connection pool connection for multiple queries', function(done) {
		var pool = nqb.QueryBuilder(Object.assign({}, settings), driver, 'pool');

		pool.get_connection(function(qb) {
			qb.query('select * from `cities` where `city` = "Gainesville"', function(err, res) {
				if (res.length > 0) {
					qb.query('select * from `cities` where `state_code` = "' + res[0].state_code + '"', function(err, res) {
						check(done, function() { connection_released(qb); });
					});
				} else {
					check(done, function() { connection_released(qb); });
				}
			});
		});
	});
});
