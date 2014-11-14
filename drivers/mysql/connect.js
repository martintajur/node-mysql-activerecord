/**
 * MySQL Connection Library
 * Version 0.0.1
 *
 * Fundamentally, this is a wrapper to the awesome `node-mysql` project that
 * simply allows it to work generically within the Query Builder module.
 *
 * Supported connection types:
 * - Single
 * - Pool
 * - PoolCluster
 *
 * Dependencies: node-mysql
 *
**/

var Adapter = function(settings,type) {
	var mysql = require('mysql');
	
	this.debugging = false;
	this.connection = null;
	this.connection_pool = null;
	this.connection_type = 'single';
	
	// Enable debugging if necessary
	if (settings.hasOwnProperty('qb_debug') && settings.debug === true) {
		this.debugging = true;
		delete settings.qb_debug;
	}
	
	this.settings = settings;
	if (this.settings.hasOwnProperty('connection_type')) {
		this.connection_type = this.settings.connection_type;
		delete settings.connection_type;
	}
	
	// Verify that required fields are provided...
	if (!this.settings.hasOwnProperty('user')) throw new Error("No user property provided. Hint: It can be NULL");
	if (!this.settings.hasOwnProperty('password')) throw new Error("No user property provided. Hint: It can be NULL");
	
	// ****************************************************************************
	// Sets up a cluster of pooled connections  to different servers for load
	// balancing and failover
	// -----
	// @param	Object	settings	Connection settings
	// @return	VOID
	// ****************************************************************************
	this.cluster = function() {
		throw new Error("Not implemented yet!");
	};
	
	// ****************************************************************************
	// Method for immediately destoying all open connections to MySQL--even if there
	// are active queries being processed.
	// -----
	// @return	VOID
	// ****************************************************************************
	this.destroy = function() {
		return that.connection.destroy();
	};
	
	// ****************************************************************************
	// Method for gracefully closing all connections to MySQL after all active 
	// queries have completed.
	// -----
	// @param	Function	callback	What to do once connection has been closed.
	// @return	VOID
	// ****************************************************************************
	this.disconnect = function(callback) {
		return that.connection.end(callback);
	};
	
	// ****************************************************************************
	// Escape values for MySQL
	// -----
	// @param	Mixed	item	String to escape
	// @return	String			Escaped value
	// ****************************************************************************
	this.escape = function(item) {
		that.get_connection(function(connection) {
			return connection.escape(item);
		});
	}
	
	// ****************************************************************************
	// Returns a connection hangle (this will mostly be used for cluster and pool
	// connection types, but, nonetheless can be used as a getter for the single
	// type as well.
	// -----
	// @param	Function	callback	What to do once the connection is obtained
	// @return	VOID
	// ****************************************************************************
	this.get_connection = function(callback) {
		switch(that.connection_type) {
			case 'cluster':
				break;
			case 'pool':
				if (null === that.connection_pool) {
					var error_msg = "Connection pool not available!";
					if (console && console.hasOwnProperty('error')) console.error(error_msg);
					throw new Error(error_msg);
				}
				that.connection_pool.getConnection(function (err, connection) {
					if (err) {
						throw err;
					}
					callback(connection);
				});
				break;
			case 'single':
			default:
				callback(this.connection);
				break;
		}
	};
	
	// ****************************************************************************
	// Sets up a connection pool
	// -----
	// @param	Object	settings	Connection settings
	// @return	VOID
	// ****************************************************************************
	this.pool = function() {
		that.connection_pool = mysql.createPool(this.settings);

		that.connection_pool.query('SELECT 1 + 1 AS solution', function(err) {
			if (err) throw err;
			if (that.debugging === true) {
				console.log('mysql connection pool created');
			}
		});
		
		return {
			disconnect: function() {
				that.connection_pool.end(responseCallback);
			}
		}
	};
	
	// ****************************************************************************
	// Sets up a standard one-time connection (no pooling). This one is used by the
	// other two methods to stay DRY.
	// -----
	// @param	Object	settings	Connection settings
	// @return	VOID
	// ****************************************************************************
	this.single = function() {
		that.connection = mysql.createConnection(this.settings);
		that.connection.connect(function(err) {
			if (err) {
				console.error('error connecting to mysql: ' + err.stack);
				return;
			}
			if (this.debugging === true) {
				console.log('connected to mysql as id ' + connection.threadId);
			}
		});
		
		that.connection.on('error', function(err) {
			console.error(err.code);
		});
	};
	
	var that = this;
	return that;
}

exports.Adapter = Adapter;