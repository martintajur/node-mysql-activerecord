// ****************************************************************************
// QueryBuilder "Query Execution" methods.
// -----
// @param	Object	qb			The QueryBuilder object
// @param	Object	adapter		The connection adapter object
// ****************************************************************************
var QueryExec = function(qb, adapter) {	
	var exec = function(sql, callback) {
		adapter.get_connection(function(connection) {
			connection.query(sql, function(err, rows) {
				if (adapter.connection_type === 'standard') {
					callback(err, rows);
				} else {
					callback(err, rows, connection);
				}
			});
		});
	};
	
	return {
		query: function(sql, callback) {
			exec(sql,callback);
		},
	
		count: function(table, callback) {
			var sql = qb.count(table);
			qb.reset_query(sql);
			exec(sql,callback);
		},
		
		get: function(table,callback) {
			// The table parameter is optional, it could be the callback...
			if (typeof table === 'function' && typeof callback !== 'function') {
				callback = table;
			}
			else if (typeof table === 'undefined' && typeof callback !== 'function') {
				throw new Error("No callback function has been provided in your 'get' call!");
			}
		
			var sql = qb.get(table);
			qb.reset_query(sql);
			exec(sql,callback);
		},
		
		get_where: function(table,where,callback) {
			if (typeof table !== 'string' && Object.prototype.toString.call(table) !== Object.prototype.toString.call([])) {
				throw new Error("First parameter of get_where() must be a string or an array of strings.");
			}
			if (Object.prototype.toString.call(where) !== Object.prototype.toString.call({})) {
				throw new Error("Second parameter of get_where() must be an object with key:value pairs.");
			}
			var sql = qb.get_where(table,where);
			qb.reset_query(sql);
			exec(sql,callback);
		},
		
		insert: function(table,set,callback,ignore,suffix) {
			var sql = qb.insert(table,set,ignore,suffix);
			qb.reset_query(sql);
			exec(sql,callback);
		},
		
		insert_ignore: function(table,set,callback) {
			var sql = qb.insert_ignore(table,set);
			qb.reset_query(sql);
			exec(sql,callback);
		},
		
		insert_batch: function(table,set,callback) {
			var sql = qb.insert_batch(table,set);
			qb.reset_query(sql);
			exec(sql,callback);
		},
		
		update: function(table,set,where,callback) {
			// The where parameter is optional, it could be the callback...
			if (typeof where === 'function' && typeof callback !== 'function') {
				callback = where;
			}
			else if (typeof where === 'undefined' && typeof callback !== 'function') {
				throw new Error("No callback function has been provided in your update call!");
			}
			else if (typeof where === 'undefined' || where === false || (where !== null && typeof where === 'object' && where.length == 0)) {
				where = null;
			}
			
			var sql = qb.update(table,set,where);
			qb.reset_query(sql);
			exec(sql,callback);
		},
		
		// TODO: Write this complicated-ass function
		update_batch: function(table,set,where,callback) {
			adapter.get_connection(function(connection) {
				if (adapter.connection_type === 'standard') {
					callback(new Error("This function is not currently available!"),null);
				} else {
					callback(new Error("This function is not currently available!"),null, connection);
				}
				
			});
		},
		
		delete: function(table, where, callback) {
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
			exec(sql,callback);
		},
		
		empty_table: function(table, callback) {
			var sql = qb.empty_table(table,callback);
			qb.reset_query(sql);
			exec(sql,callback);
		},
		
		truncate: function(table, callback) {
			var sql = qb.truncate(table,callback);
			qb.reset_query(sql);
			exec(sql,callback);
		},
	}
}

exports.QueryExec = QueryExec;