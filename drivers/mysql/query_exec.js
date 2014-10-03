// ****************************************************************************
// QueryBuilder "Query Execution" methods.
// -----
// @param	Object	qb			The QueryBuilder object
// @param	Object	adapter		The connection adapter object
// ****************************************************************************
var QueryExec = function(qb, adapter) {	
	return {
		count: function(table, callback) {
			var sql = qb.count(table);
			
			adapter.get_connection(function(connection) {
				connection.query(sql, function(err, res) { 
					if (err)
						callback(err, null);
					else
						callback(null, res[0]['count']);
				});
			});
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
			adapter.get_connection(function(connection) {
				connection.query(sql, callback);
			});
		},
		
		get_where: function(table,where,callback) {
			var sql = qb.get_where(table,where);
			qb.reset_query(sql);
			adapter.get_connection(function(connection) {
				connection.query(sql, callback);
			});
		},
		
		insert: function(table,set,callback,ignore,suffix) {
			var sql = qb.insert(table,set,ignore,suffix);
			qb.reset_query(sql);
			adapter.get_connection(function(connection) {
				connection.query(sql,callback);
			});
		},
		
		insert_ignore: function(table,set,callback) {
			var sql = qb.insert_ignore(table,set);
			qb.reset_query(sql);
			adapter.get_connection(function(connection) {
				connection.query(sql, callback);
			});
		},
		
		insert_batch: function(table,set,callback) {
			var sql = qb.insert_batch(table,set);
			qb.reset_query(sql);
			adapter.get_connection(function(connection) {
				connection.query(sql, callback);
			});
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
			adapter.get_connection(function(connection) {
				connection.query(sql, callback);
			});
		},
		
		// TODO: Write this complicated-ass function
		update_batch: function(table,set,where,callback) {
			callback(new Error("This function is not currently available!"),null);
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
			adapter.get_connection(function(connection) {
				connection.query(sql, callback);
			});
		},
		
		empty_table: function(table, callback) {
			var sql = qb.empty_table(table,callback);
			qb.reset_query(sql);
			adapter.get_connection(function(connection) {
				connection.query(sql,callback);
			});
		},
		
		truncate: function(table, callback) {
			var sql = qb.truncate(table,callback);
			qb.reset_query(sql);
			adapter.get_connection(function(connection) {
				connection.query(sql,callback);
			});
		},
	}
}

exports.QueryExec = QueryExec;