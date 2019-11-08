// Load MySQL Driver
const mysql = require('mysql');
const Adapter = require('../adapter.js');

class Single extends Adapter {
    constructor(settings, pool) {
        super(settings, pool);

        // Set defaults
        this.pool = null;
        this._connection = null;

        // If the Pool object is instatiating this Adapter, use it's connection
        if (pool && pool.pool) {
            this.pool = pool.pool.pool; // NOTE: That truely is insane looking... ¯\_(ツ)_/¯
            this._connection = pool.pool.connection;
        }
        // Otherwise, let's create a new connection
        else {
            this._connection = new mysql.createConnection(this._connection_settings);
        }

        if (!this._connection) throw new Error("No connection could be established!");

        // this.qb = this.get_query_builder();
        // this.qe = this.get_query_exec(this.qb, this._connection);
    }

    connection_settings() {
        return this._connection_settings;
    }

    connect(cb) {
        if (!cb || (cb && typeof cb !== 'function')) {
            return new Promise((resolve, reject) => {
                return this._connection.connect((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            this._connection.connect(cb);
        }
    }

    connection() {
        return this._connection;
    }

    escape_id(str) {
        return this._connection.escapeId(str);
    }

    disconnect(cb) {
        if (!cb || (cb && typeof cb !== 'function')) {
            return new Promise((resolve, reject) => {
                this._connection.end((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            this._connection.end(cb);
        }
    }

    release() {
        if (!this.pool) throw new Error("You cannot release a non-pooled connection from a connection pool!");
        this.pool.releaseConnection(this._connection);
    }
}

module.exports = Single;
