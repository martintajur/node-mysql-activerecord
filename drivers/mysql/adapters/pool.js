const mysql = require('mysql');
const Adapter = require('../adapter.js');
const Single = require('./single.js');

class Pool extends Adapter {
    constructor(settings) {
        super(settings);

        // Create pool for node-querybuild object if it doesn't already have one.
        if (!this.hasOwnProperty('pool') || this._pool.length === 0) {
            // Create connection Pool
            this._pool = mysql.createPool(this._connection_settings);

            // Test connection pool (asynchronous -- this shouldn't prevent the pool from initially loading)
            if (this.debugging === true) {
                this._pool.getConnection((err, connection) => {
                    connection.query('SELECT 1 + 1 AS solution', err => {
                        connection.release();
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('mysql connection pool created');
                        }
                    });
                });
            }
        }
    }

    pool() {
        return this._pool;
    }

    get_connection(cb) {
        if (!this._pool) {
            const error_msg = "Connection pool not available!";
            if (console && console.hasOwnProperty('error')) console.error(error_msg);
            throw new Error(error_msg);
        }

        const self = this;
        const handler = (resolve, reject) => {
            self._pool.getConnection((err, connection) => {
                if (err) throw err;

                const adapter = new Single(self._original_settings, {
                    pool: {
                        pool: self._pool,
                        connection
                    }
                });

                if ((!cb || typeof cb !== 'function') && (typeof resolve === 'function' && typeof reject === 'function')) return resolve(adapter);
                else if (cb && typeof cb === 'function') return cb(adapter);
                throw ERRORS.NO_VALID_RESULTS_HANDLER;
            });
        }

        if (!cb || (cb && typeof cb !== 'function')) {
            return new Promise(handler);
        } else {
            handler();
        }
    }

    disconnect(cb) {
        if (!cb || (cb && typeof cb !== 'function')) {
            return new Promise((resolve, reject) => {
                this._pool.end((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            this._pool.end(cb);
        }
    }
}

module.exports = Pool;
