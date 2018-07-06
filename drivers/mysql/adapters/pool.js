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

        this._pool.getConnection((err, connection) => {
            if (err) throw err;
            const adapter = new Single(this._original_settings, {
                pool: {
                    pool: this._pool,
                    connection: connection
                }
            });

            cb(adapter);
        });
    }

    disconnect(cb) {
        this._pool.end(cb);
    }
}

module.exports = Pool;
