/**
 * MySQL ActiveRecord Adapter for Node.js
 * (C) Martin Tajur 2011-2013
 * martin@tajur.ee
 * 
 * Active Record Database Pattern implementation for use with node-mysql as MySQL connection driver.
 * 
 * Dual licensed under the MIT and GPL licenses.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL KEVIN VAN ZONNEVELD BE LIABLE FOR ANY CLAIM, DAMAGES
 * OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * 
**/
var Adapter = function(settings) {
	var mysql = require('mysql');
	
	this.qb = require('./lib/query_builder.js').QueryBuilder();
	
	// Non-Public QueryBuilder APIs
	this._where				= this.qb._where;
	this._where_in			= this.qb._where_in;
	this._like				= this.qb._like;
	this._min_max_avg_sum	= this.qb._min_max_avg_sum;
	this._having			= this.qb._having;
	this._update			= this.qb._update;
	this.resetQuery			= this.qb.resetQuery;
	
	// QueryBuilder Properties
	this.whereArray			= this.qb.whereArray;
	this.whereInArray		= this.qb.whereInArray;
	this.fromArray			= this.qb.fromArray;
	this.joinArray			= this.qb.joinArray;
	this.selectArray		= this.qb.selectArray;
	this.setArray			= this.qb.setArray;
	this.orderByArray		= this.qb.orderByArray;
	this.orderByDir			= this.qb.orderByDir;
	this.groupByArray		= this.qb.groupByArray;
	this.havingArray		= this.qb.havingArray;
	this.limitTo			= this.qb.limitTo;
	this.offsetVal			= this.qb.offsetVal;
	this.joinClause			= this.qb.joinClause;
	this.lastQueryString	= this.qb.lastQueryString;
	this.distinctClause		= this.qb.distinctClause;
	this.aliasedTables		= this.qb.aliasedTables;
	
	// QueryBuilder method mappings for backwards compatibility
	this.where 			 	= this.qb.where;
	this.or_where 		 	= this.qb.or_where;
	this.where_in 		 	= this.qb.where_in;
	this.or_where_in	 	= this.qb.or_where_in;
	this.where_not_in 	 	= this.qb.where_not_in;
	this.or_where_not_in	= this.qb.or_where_not_in;
	this.like 			 	= this.qb.like;
	this.not_like 		 	= this.qb.not_like;
	this.or_like		 	= this.qb.or_like;
	this.or_not_like 	 	= this.qb.or_not_like;
	this.from 			 	= this.qb.from;
	this.join 			 	= this.qb.join;
	this.select 		 	= this.qb.select;
	this.select_min 	 	= this.qb.select_min;
	this.select_max 	 	= this.qb.select_max;
	this.select_avg 	 	= this.qb.select_avg;
	this.select_sum 	 	= this.qb.select_sum;
	this.distinct 		 	= this.qb.distinct;
	this.group_by 		 	= this.qb.group_by;
	this.having 		 	= this.qb.having;
	this.or_having 		 	= this.qb.or_having;
	this.order_by 		 	= this.qb.order_by;
	this.limit 			 	= this.qb.limit;
	this.offset 		 	= this.qb.offset;
	this.set				= this.qb.set;
	this.get_compiled_select = this.qb.get_compiled_select;
	this.get_compiled_insert = this.qb.get_compiled_insert;
	this.get_compiled_update = this.qb.get_compiled_update;
	this.get_compiled_delete = this.qb.get_compiled_delete;
	this._last_query 	 	= this.qb._last_query;
	this.last_query 	 	= this.qb._last_query;
	
	// QueryBuilder "Query Execution" methods:
	this.count = function(table, callback) {
		var sql = this.qb.count(table);
		
		connection.query(sql, function(err, res) { 
			if (err)
				callback(err, null);
			else
				callback(null, res[0]['count']);
		});
		
		return that;
	};
	
	this.get = function(table,callback) {
		// The table parameter is optional, it could be the callback...
		if (typeof table === 'function' && typeof callback !== 'function') {
			callback = table;
		}
		else if (typeof table === 'undefined' && typeof callback !== 'function') {
			throw new Error("No callback function has been provided in your 'get' call!");
		}
	
		var sql = this.qb.get(table,callback);
		this.resetQuery(sql);
		connection.query(sql, callback);
		return that;
	};
	
	this.get_where = function(table,where,callback) {
		var sql = this.qb.get_where(table,where);
		this.resetQuery(sql);
		connection.query(sql, callback);
		return that;
	};
	
	this.insert	= function(table,set,callback,verb,suffix) {
		var sql = this.qb.insert(table,set,callback,verb,suffix);
		this.resetQuery(sql);
		connection.query(sql);
		return that;
	};
	
	this.insert_ignore 	= function(table,set,callback) {
		var sql = this.qb.insert_ignore(table,set,callback);
		this.resetQuery(sql);
		connection.query(sql, callback);
		return that;
	};
	
	this.insert_batch = function(table,set,callback) {
		var sql = this.qb.insert_batch(table,set,callback);
		this.resetQuery(sql);
		connection.query(sql, callback);
		return that;
	};
	
	this.update = function(table,set,where,callback) {
		// The where parameter is optional, it could be the callback...
		if (typeof where === 'function' && typeof callback !== 'function') {
			callback = where;
		}
		else if (typeof where === 'undefined' && typeof callback !== 'function') {
			throw new Error("No callback function has been provided in your 'update' call!");
		}
		
		var sql = this.qb.update(table,set,where,callback);
		this.resetQuery(sql);
		connection.query(sql, callback);
		return that;
	};
	
	this.update_batch = function() {
		
		return that;
	};
	
	this.delete = function(table, where, callback) {
		if (typeof where === 'function' && typeof callback !== 'function') {
			callback = where;
			where = undefined;
		}
		
		if (typeof table === 'function' && typeof callback !== 'function') {
			callback = table;
			table = undefined;
			where = undefined;
		}
		
		if (typeof callback !== 'function') {
			throw new Error("delete(): No callback function has been provided!");
		}
		
		var sql = this.delete(table, where);
		
		this.resetQuery(sql);
		connection.query(sql, callback);
		return that;
	};
	
	this.empty_table - function(table, callback) {
		var sql = this.qb.empty_table(table,callback);
		this.resetQuery(sql);
		connection.query(sql);
		return that;
	});
	
	this.truncate - function(table, callback) {
		var sql = this.qb.truncate(table,callback);
		this.resetQuery(sql);
		connection.query(sql);
		return that;
	});

	var initializeConnectionSettings = function () {
		if(settings.server) {
			settings.host = settings.server;
		}
		if(settings.username) {
			settings.user = settings.username;
		}

		if (!settings.host) {
			throw new Error('Unable to start ActiveRecord - no server given.');
		}
		if (!settings.port) {
			settings.port = 3306;
		}
		if (!settings.user) {
			settings.user = '';
		}
		if (!settings.password) {
			settings.password = '';
		}
		if (!settings.database) {
			throw new Error('Unable to start ActiveRecord - no database given.');
		}

		return settings;
	};

	var connection;
	var connectionSettings;
	var pool;

	if (settings && settings.pool) {
		pool = settings.pool.pool;
		connection = settings.pool.connection;
	} else {
		connectionSettings = initializeConnectionSettings();
		connection = new mysql.createConnection(connectionSettings);
	}
	
	if (settings.charset) {
		connection.query('SET NAMES ' + settings.charset);
	}
	
	this.connectionSettings = function() { return connectionSettings; };
	this.connection = function() { return connection; };
	
	this.query = function(sqlQueryString, responseCallback) {
		connection.query(sqlQueryString, responseCallback);
		this.resetQuery(sqlQueryString);
		return that;
	};
	
	this.disconnect = function() {
		return connection.end();
	};

	this.forceDisconnect = function() {
		return connection.destroy();
	};
	
	this.releaseConnection = function() {
		pool.releaseConnection(connection);
	};

	this.releaseConnection = function() {
		pool.releaseConnection(connection);
	};
	
	this.ping = function() {
		connection.ping();
		return that;
	};
	
	this.escape = function(str) {
		return connection.escape(str);
	};

	var reconnectingTimeout = false;

	function handleDisconnect(connectionInstance) {
		connectionInstance.on('error', function(err) {
			if (!err.fatal || reconnectingTimeout) {
				return;
			}

			if (err.code !== 'PROTOCOL_CONNECTION_LOST' && err.code !== 'ECONNREFUSED') {
				throw err;
			}

			var reconnectingTimeout = setTimeout(function() {
				connection = mysql.createConnection(connectionInstance.config);
				handleDisconnect(connection);
				connection.connect();
			}, 2000);
		});
	}

	if (!pool) {
		handleDisconnect(connection);
	}

	var that = this;
	
	return this;
};

var mysqlPool; // this should be initialized only once.
var mysqlCharset;

var Pool = function (settings) {
	if (!mysqlPool) {
		var mysql = require('mysql');

		var poolOption = {
			createConnection: settings.createConnection,
			waitForConnections: settings.waitForConnections,
			connectionLimit: settings.connectionLimit,
			queueLimit: settings.queueLimit
		};
		Object.keys(poolOption).forEach(function (element) {
			// Avoid pool option being used by mysql connection.
			delete settings[element];
			// Also remove undefined elements from poolOption
			if (!poolOption[element]) {
				delete poolOption[element];
			}
		});

		// Confirm settings with Adapter.
		var db = new Adapter(settings);
		var connectionSettings = db.connectionSettings();

		Object.keys(connectionSettings).forEach(function (element) {
			poolOption[element] = connectionSettings[element];
		});

		mysqlPool = mysql.createPool(poolOption);
		mysqlCharset = settings.charset;
	}

	this.pool = function () {
		return mysqlPool;
	};

	this.getNewAdapter = function (responseCallback) {
		mysqlPool.getConnection(function (err, connection) {
			if (err) {
				throw err;
			}
			var adapter = new Adapter({
				pool: {
					pool: mysqlPool,
					enabled: true,
					connection: connection
				},
				charset: mysqlCharset
			});
			responseCallback(adapter);
		});
	};

	this.disconnect = function (responseCallback) {
		this.pool().end(responseCallback);
        };

	return this;
};

exports.Adapter = Adapter;
exports.Pool = Pool;
