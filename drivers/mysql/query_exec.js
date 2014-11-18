// ****************************************************************************
// QueryBuilder "Query Execution" methods.
// -----
// @param	Object	qb			The QueryBuilder object
// @param	Object	adapter		The connection adapter object
// ****************************************************************************
var QueryExec = function(qb, adapter) {
	
	var do_query = function(conn, sql, callback) {
		conn.query(sql, function(err, results) {
			// Standardize some important properties
			if (!err && results.length > 0) {
			
				// Insert ID
				if (results.hasOwnProperty('insertId')) {
					results.insert_id = results.insertId;
				}
				
				// Affected Rows
				if (results.hasOwnProperty('affectedRows')) {
					results.affected_rows = results.affectedRows;
				}
				
				// Changed Rows
				if (results.hasOwnProperty('changedRows')) {
					results.changed_rows = results.changedRows;
				}
			}
		
			if (adapter.connection_type === 'standard') {
				callback(err, results);
			} else {
				callback(err, results, conn);
			}
		});
	};
	
	var exec = function(sql, callback, conn) {
		if (Object.prototype.toString.call(conn) == Object.prototype.toString.call({})) {
			do_query(conn, sql, callback);
		}
		else {
			adapter.get_connection(function(connection) {
				if (connection === null) {
					throw Error("A connection to the database could not be established!");
				}
				do_query(connection, sql, callback);
			});
		}
	};
	
	return {
		query: function(sql, callback, conn) {
			exec(sql, callback, conn);
		},
	
		count: function(table, callback, conn) {
			if (typeof table === 'function' && typeof callback !== 'function') {
				table = null;
				callback = table;
			}
			
			var sql = qb.count(table);
			qb.reset_query(sql);
			exec(sql, function(err, row) {
				if (!err) {
					callback(err, row.numrows);
				}
				else {
					callback(err, row);
				}
			}, conn);
		},
		
		get: function(table,callback,conn) {
			// The table parameter is optional, it could be the callback...
			if (typeof table === 'function' && typeof callback !== 'function') {
				callback = table;
			}
			else if (typeof table === 'undefined' && typeof callback !== 'function') {
				throw new Error("No callback function has been provided in your 'get' call!");
			}
		
			var sql = qb.get(table);
			qb.reset_query(sql);
			exec(sql,callback,conn);
		},
		
		get_where: function(table,where,callback,conn) {
			if (typeof table !== 'string' && Object.prototype.toString.call(table) !== Object.prototype.toString.call([])) {
				throw new Error("First parameter of get_where() must be a string or an array of strings.");
			}
			if (Object.prototype.toString.call(where) !== Object.prototype.toString.call({})) {
				throw new Error("Second parameter of get_where() must be an object with key:value pairs.");
			}
			var sql = qb.get_where(table,where);
			qb.reset_query(sql);
			exec(sql,callback,conn);
		},
		
		insert: function(table,set,callback,ignore,suffix,conn) {
			var sql = qb.insert(table,set,ignore,suffix);
			qb.reset_query(sql);
			exec(sql,callback,conn);
		},
		
		insert_ignore: function(table,set,callback,conn) {
			var sql = qb.insert_ignore(table,set);
			qb.reset_query(sql);
			exec(sql,callback,conn);
		},
		
		insert_batch: function(table,set,callback,conn) {
			var sql = qb.insert_batch(table,set);
			qb.reset_query(sql);
			exec(sql,callback,conn);
		},
		
		update: function(table,set,where,callback,conn) {
			// The where parameter is optional, it could be the callback...
			if (typeof where === 'function' && typeof callback !== 'function') {
				callback = where;
				where = null;
			}
			else if (typeof where === 'undefined' && typeof callback !== 'function') {
				throw new Error("No callback function has been provided in your update call!");
			}
			else if (typeof where === 'undefined' || where === false || (where !== null && typeof where === 'object' && where.length == 0)) {
				where = null;
			}
			
			var sql = qb.update(table,set,where,conn);
			qb.reset_query(sql);
			exec(sql,callback,conn);
		},
		
		// TODO: Write this complicated-ass function
		update_batch: function(table,set,where,callback,conn) {
			adapter.get_connection(function(connection) {
				if (adapter.connection_type === 'standard') {
					callback(new Error("This function is not currently available!"),null);
				} else {
					callback(new Error("This function is not currently available!"),null, connection);
				}
				
			});
		},
		
		delete: function(table, where, callback,conn) {
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
			
			var sql = qb.delete(table, where);
			
			qb.reset_query(sql);
			exec(sql,callback,conn);
		},
		
		empty_table: function(table, callback,conn) {
			var sql = qb.empty_table(table,callback);
			qb.reset_query(sql);
			exec(sql,callback,conn);
		},
		
		truncate: function(table, callback,conn) {
			var sql = qb.truncate(table,callback);
			qb.reset_query(sql);
			exec(sql,callback,conn);
		},
	}
}

exports.QueryExec = QueryExec;