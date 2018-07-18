// Load Tedious connection library
const Connection = require('tedious').Connection;
const Adapter = require('../adapter.js');
const tsqlstring = require('tsqlstring');

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
            const self = this;
            function SQLConnection() {};
            SQLConnection.prototype.connect = function(cb) {
                this.connection = new Connection(self._connection_settings);
                this.connection.on('error', cb);
                this.connection.on('connect', cb);
                return this.connection;
            }
            this.sql_connection = new SQLConnection();
        }
    }

    connection_settings() {
        return {connection_settings: this._connection_settings, pool_settings: this.pool_settings};
    }

    connect(cb) {
        if (this._connection) return this._connection;
        this._connection = this.sql_connection.connect(cb);
    }

    connection() {
         return this._connection;
    }

    escape_id(str) {
        return tsqlstring.escapeId(str);
    }

    disconnect(callback) {
        if (this.pool) {
            this.pool.drain();
        } else {
            this._connection.close();
        }
        if (callback && typeof callback === 'function') callback(null);
    }

    release() {
        if (!this.pool) throw new Error("You cannot release a non-pooled connection from a connection pool!");
        this.pool.release(this._connection);
    }
}

module.exports = Single;
