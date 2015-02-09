var _ = require('underscore');
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

describe('QueryBuilder() - MySQL', function() {
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
	var bad_user = _.extend({},settings); bad_user.user = 'foobar';
	var bad_host = _.extend({},settings); bad_host.host = 'nonlocalhost';
	var bad_password = _.extend({},settings); bad_password.password = 'password';
	var bad_database = _.extend({},settings); bad_database.database = 'bad_mock_db';
	var bad_port = _.extend({},settings); bad_port.port = 1;
	var bad_version = _.extend({},settings); bad_version.version = 12;
	
	it('should exist', function() {
		should.exist(nqb.QueryBuilder);
	});
	it('should be a function', function() {
		nqb.QueryBuilder.should.be.a('function');
	});
	it('should establish a single connection given valid connection credentials', function(done) {
		var qb = nqb.QueryBuilder(_.extend({}, settings), driver);
		expect(qb, 'should have connect property').to.have.property('connect');
		qb.connect(function(err) {
			check(done, function() {
				expect(err, 'should be connected').to.not.be.instanceof(Error);
			});
		});
	});
	it('should allow us to disconnect from MySQL', function(done) {
		var qb = nqb.QueryBuilder(_.extend({}, settings), driver);
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
		expect(function() { nqb.QueryBuilder( _.extend({}, settings), driver); 	}, 'valid driver version').to.not.throw(Error);
		expect(function() { nqb.QueryBuilder(bad_version, driver);				}, 'invalid driver version').to.throw(Error);
	});
	
	it('should allow us to retrieve our connection settings for reference', function(done) {
		var conn_settings = _.extend({}, settings, {password: undefined});
		delete conn_settings.version;
		
		var qb = nqb.QueryBuilder(_.extend({}, settings), driver);
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
		var qb = nqb.QueryBuilder(_.extend({}, settings), driver);
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
		var qb = nqb.QueryBuilder(_.extend({}, settings), driver);
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
});
