const QueryBuilder = require('./query_builder.js');
const ERROR = require("../QueryExecError");
const WrapperPromise = require("../WrapperPromise");

// ****************************************************************************
// QueryBuilder "Query Execution" methods.
// ****************************************************************************
class QueryExec extends QueryBuilder {
    constructor() {
        super();
    }

    _exec(sql, cb) {
        if (Object.prototype.toString.call(this._connection) === Object.prototype.toString.call({})) {
            this._connection.query(sql, (err, results) => {
                // Standardize some important properties
                if (!err && results && !Array.isArray(results)) {

                    // Insert ID
                    if (results.hasOwnProperty('insertId')) {
                        results.insert_id = results.insertId || null;
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

                cb(err, results);
            });
        } else {
            throw ERROR.NO_CONN_OBJ_ERR;
        }
    }

    query(sql, cb) {
        if (!cb || typeof cb !== "function") return new WrapperPromise(sql, this._exec.bind(this)).promisify();
        this._exec(sql, cb);
    }

    count(table, cb) {
        if (typeof table === 'function' && typeof cb !== 'function') {
            table = null;
            cb = table;
        }

        const sql = this._count(table);
        this.reset_query(sql);

        const handler = (err, row) => {
            if (!err) {
                if (typeof callback !== "function") {
                    this.resolve(row[0].numrows);
                    return;
                }
                cb(err, row[0].numrows);
            }
            else {
                if (typeof callback !== "function") {
                    this.reject(err);
                    return;
                }
                cb(err, row);
            }
        }

        if (typeof cb !== "function") return new WrapperPromise(sql, this._exec.bind(this), handler).promisify();
        this._exec(sql, handler);
    }

    get(table, cb, conn) {
        // The table parameter is optional, it could be the cb...
        if (typeof table === 'function' && typeof cb !== 'function') {
            cb = table;
        }

        const sql = this._get(table);
        this.reset_query(sql);

        if (typeof cb !== "function") return new WrapperPromise(sql, this._exec.bind(this)).promisify();
        this._exec(sql, cb);
    }

    get_where(table, where, cb) {
        if (typeof table !== 'string' && !Array.isArray(table)) {
            throw ERROR.FIRST_PARAM_OF_GET_WHERE_ERR;
        }
        if (Object.prototype.toString.call(where) !== Object.prototype.toString.call({})) {
            throw ERROR.SECOND_PARAM_OF_GET_WHERE_ERR;
        }
        const sql = this._get_where(table, where);
        this.reset_query(sql);

        if (typeof cb !== "function") return new WrapperPromise(sql, this._exec.bind(this)).promisify();
        this._exec(sql, cb);
    }

    insert(table, set, cb, ignore, suffix) {
        const sql = this._insert(table, set, ignore, suffix);
        this.reset_query(sql);

        if (typeof cb !== "function") return new WrapperPromise(sql, this._exec.bind(this)).promisify();
        this._exec(sql, cb);
    }

    insert_ignore(table, set, on_dupe, cb) {
        if (typeof on_dupe === 'function') {
            cb = on_dupe;
            on_dupe = null;
        }

        const sql = this._insert_ignore(table, set, on_dupe);
        this.reset_query(sql);

        if (typeof cb !== "function") return new WrapperPromise(sql, this._exec.bind(this)).promisify();
        this._exec(sql, cb);
    }

    insert_batch(table, set, ignore, on_dupe, cb) {
        if (typeof ignore === 'function') {
            cb = ignore;
            ignore = null;
        }
        else if (typeof on_dupe === 'function') {
            cb = on_dupe;
            on_dupe = null;
        }

        const sql = this._insert_batch(table, set, ignore, on_dupe);
        this.reset_query(sql);

        if (typeof cb !== "function") return new WrapperPromise(sql, this._exec.bind(this)).promisify();
        this._exec(sql, cb);
    }

    update(table, set, where, cb) {
        // The where parameter is optional, it could be the cb...
        if (typeof where === 'function' && typeof cb !== 'function') {
            cb = where;
            where = null;
        }
        else if (typeof where === 'undefined' || where === false || (where !== null && typeof where === 'object' && Object.keys(where).length === 0)) {
            where = null;
        }

        const sql = this._update(table, set, where);
        this.reset_query(sql);

        if (typeof cb !== "function") return new WrapperPromise(sql, this._exec.bind(this)).promisify();
        this._exec(sql, cb);
    }

    // TODO: Write this complicated-ass function
    update_batch(table, set, index, where, cb) {
        // The where parameter is optional, it could be the cb...
        if (typeof where === 'function' && typeof cb !== 'function') {
            cb = where;
            where = null;
        }
        else if (typeof where === 'undefined' || where === false || (where !== null && typeof where === 'object' && Object.keys(where).length === 0)) {
            where = null;
        }

        const sqls = this._update_batch(table, set, index, where);
        const results = null;
        const errors = [];

        // Execute each batch of (at least) 100
        const handler = (resolve, reject) => {
            (function next_batch() {
                const sql = sqls.shift();
                this.reset_query(sql);

                this._exec(sql, (err, res) => {
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
                        setTimeout(next_batch, 0);
                    } else {
                        if ((!cb || typeof cb !== 'function') && (typeof resolve === 'function' && typeof reject === 'function')) {
                            if (Array.isArray(errors) && errors.length > 0) return reject(new Error(errors.join("\n\n")));
                            return resolve(results);
                        } else if (cb && typeof cb === 'function') {
                            return cb(errors, results);
                        } else {
                            throw ERRORS.NO_VALID_RESULTS_HANDLER;
                        }
                    }
                });
            })();
        };

        if (!cb || cb !== 'function') {
            return new Promise(handler);
        } else {
            handler();
        }
    }

    delete(table, where, cb) {
        if (typeof where === 'function' && typeof cb !== 'function') {
            cb = where;
            where = undefined;
        }

        if (typeof table === 'function' && typeof cb !== 'function') {
            cb = table;
            table = undefined;
            where = undefined;
        }

        const sql = this._delete(table, where);
        this.reset_query(sql);

        if (typeof cb !== "function") return new WrapperPromise(sql, this._exec.bind(this)).promisify();
        this._exec(sql, cb);
    }

    empty_table(table, cb) {
        const sql = this._empty_table(table, cb);
        this.reset_query(sql);

        if (typeof cb !== "function") return new WrapperPromise(sql, this._exec.bind(this)).promisify();
        this._exec(sql, cb);
    }

    truncate(table, cb) {
        const sql = this._truncate(table, cb);
        this.reset_query(sql);

        if (typeof cb !== "function") return new WrapperPromise(sql, this._exec.bind(this)).promisify();
        this._exec(sql, cb);
    }
}

module.exports = QueryExec;
