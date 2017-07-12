// ****************************************************************************
// QueryBuilder "Query Execution" methods.
// -----
// @param    Object    qb            The QueryBuilder object
// @param    Object    adapter        The connection adapter object
// ****************************************************************************
const QueryExec = function (qb, conn) {

    const exec = (sql, callback) => {
        if (Object.prototype.toString.call(conn) == Object.prototype.toString.call({})) {
            conn.query(sql, (err, results) => {
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

                callback(err, results);
            });
        } else {
            throw new Error("No connection object supplied to the Query Exec Library!");
        }
    };

    return {
        query: function(sql, callback) {
            exec(sql, callback);
        },

        count: function(table, callback) {
            if (typeof table === 'function' && typeof callback !== 'function') {
                table = null;
                callback = table;
            }

            const sql = qb.count(table);
            qb.reset_query(sql);
            exec(sql, (err, row) => {
                if (!err) {
                    //console.dir(row[0].numrows);
                    callback(err, row[0].numrows);
                }
                else {
                    callback(err, row);
                }
            });
        },

        get: function(table,callback,conn) {
            // The table parameter is optional, it could be the callback...
            if (typeof table === 'function' && typeof callback !== 'function') {
                callback = table;
            }
            else if (typeof table === 'undefined' && typeof callback !== 'function') {
                throw new Error("No callback function has been provided in your 'get' call!");
            }

            const sql = qb.get(table);
            qb.reset_query(sql);
            exec(sql,callback);
        },

        get_where: function(table,where,callback) {
            if (typeof table !== 'string' && !Array.isArray(table)) {
                throw new Error("First parameter of get_where() must be a string or an array of strings.");
            }
            if (Object.prototype.toString.call(where) !== Object.prototype.toString.call({})) {
                throw new Error("Second parameter of get_where() must be an object with key:value pairs.");
            }
            const sql = qb.get_where(table,where);
            qb.reset_query(sql);
            exec(sql,callback);
        },

        insert: function(table,set,callback,ignore,suffix) {
            const sql = qb.insert(table,set,ignore,suffix);
            qb.reset_query(sql);
            exec(sql,callback);
        },

        insert_ignore: function(table,set,on_dupe,callback) {
			if (typeof on_dupe === 'function') {
				callback = on_dupe;
				on_dupe = null;
			}
			const sql = qb.insert_ignore(table,set,on_dupe);
            qb.reset_query(sql);
            exec(sql,callback);
        },

        insert_batch: function(table,set,callback) {
            const sql = qb.insert_batch(table,set);
            qb.reset_query(sql);
            exec(sql,callback);
        },

        update: function(table,set,where,callback) {
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

            const sql = qb.update(table,set,where);
            qb.reset_query(sql);
            exec(sql,callback);
        },

        // TODO: Write this complicated-ass function
        update_batch: function(table,set,index,where,callback) {
            // The where parameter is optional, it could be the callback...
            if (typeof where === 'function' && typeof callback !== 'function') {
                callback = where;
                where = null;
            }
            else if (typeof where === 'undefined' && typeof callback !== 'function') {
                throw new Error("No callback function has been provided in your update_batch call!");
            }
            else if (typeof where === 'undefined' || where === false || (where !== null && typeof where === 'object' && where.length == 0)) {
                where = null;
            }

            const sqls = qb.update_batch(table,set,index,where);
            const results = null;
            const errors = [];

            // Execute each batch of (at least) 100
            (function next_batch() {
                const sql = sqls.shift();
                qb.reset_query(sql);

                exec(sql, (err, res) => {
                    if (!err) {
                        if (null === results) {
                            results = res;
                        } else {
                            results.affected_rows += res.affected_rows;
                            results.changed_rows += res.changed_rows;
                        }
                    } else {
                        errors.push(err);
                    }

                    if (sqls.length > 0) {
                        setTimeout(next_batch,0);
                    } else {
                        return callback(errors, results);
                    }
                });
            })();
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

            const sql = qb.delete(table, where);

            qb.reset_query(sql);
            exec(sql,callback);
        },

        empty_table: function(table, callback) {
            const sql = qb.empty_table(table,callback);
            qb.reset_query(sql);
            exec(sql,callback);
        },

        truncate: function(table, callback) {
            const sql = qb.truncate(table,callback);
            qb.reset_query(sql);
            exec(sql,callback);
        },
    }
}

exports.QueryExec = QueryExec;
