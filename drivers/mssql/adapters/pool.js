// Load Tedious connection pool library
const ConnectionPool = require('tedious-connection-pool');
const Adapter = require('../adapter.js');
const Single = require('./single.js');

class Pool extends Adapter {
    constructor(settings) {
        super(settings);

        // Create pool for node-querybuilder object if it doesn't already have one.
        if (!this.hasOwnProperty('pool') || this._pool.length === 0) {
            // Create connection Pool
            const ps = Object.assign({}, this.pool_settings);
            const cs = Object.assign({}, this._connection_settings);
            this._pool = new ConnectionPool(ps, cs);
            this._pool.on('error', err => {
                if (this.debugging === true) console.error(err);
            });
        }
    }

    pool() {
        return this._pool;
    }

    get_connection(cb) {
        if (!this._pool) {
            const error_msg = "Connection pool not available!";
            if (self.debugging === true) console.error(error_msg);
            throw new Error(error_msg);
        }

        const handler = (reject, resolve) => {
            this._pool.acquire((err, connection) => {
                if (err) {
                    if (cb && typeof cb === 'function') return cb(err, null);
                    else if ((!cb || typeof cb !== 'function') && (typeof resolve === 'function' && typeof reject === 'function')) return reject(err);
                    throw err;
                }

                const adapter = new Single(this._original_settings, {
                    pool: {
                        pool: this._pool,
                        connection,
                    }
                });

                if ((!cb || typeof cb !== 'function') && (typeof resolve === 'function' && typeof reject === 'function')) return resolve(adapter)
                else if (cb && typeof cb === 'function') return cb(err, adapter);
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
                this._pool.drain((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            this._pool.drain(cb);
        }
    }
}

module.exports = Pool;
