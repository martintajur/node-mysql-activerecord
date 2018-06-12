const ConnectionPool = require('tedious-connection-pool');
const Connection = require('tedious').Connection;
class Adapter {
    constructor(nqb) {
        // Verify that an instance of Node QueryBuilder was passed in
        if (!nqb || typeof nqb !== 'object') {
            throw new Error("No/Invalid QueryBuilder super object instance supplied.");
        }

        // Store QB super object as class prop
        this.nqb = Object.assign({}, nqb);

        // Verify setting property exists
        if (!this.nqb.hasOwnProperty('settings')) {
            throw new Error("No connection settings provided to initialize QueryBuilder!");
        }

        // Enable debugging if necessary
        this.debugging = false;
        if (this.nqb.settings.hasOwnProperty('debug') && this.nqb.settings.debug === true) {
            this.debugging = true;
            delete this.nqb.settings.debug;
        }

        // Verify that required fields are provided...
        if (Object.keys(this.nqb.settings).length === 0) throw new Error("No connection information provided!");
        if (!this.nqb.settings.hasOwnProperty('host')) this.nqb.settings.host = 'localhost';
        if (!this.nqb.settings.hasOwnProperty('user')) { console.log("Settings:", this.nqb.settings); throw new Error("No user property provided. Hint: It can be NULL"); }

        this.map_connection_settings();

    }

    // ****************************************************************************
    // Map generic NQB connection settings to mssql's format
    // ****************************************************************************
    map_connection_settings() {
        const settings = Object.assign({}, this.nqb.settings);

        this._connection_settings = {
            server: settings.host,
            userName: settings.user,
            password: settings.password,
            options: {
                port: 1433,
                encrypt: false,
                rowCollectionOnRequestCompletion: true,
                fallbackToDefaultDb: false,
                debug: {
                    packet: this.debugging,
                    data: this.debugging,
                    payload: this.debugging,
                    token: this.debugging,
                }
            }
        };

        if (settings.hasOwnProperty('database')) {
            this._connection_settings.options.database = settings.database;
            delete settings.database;
        }
        if (settings.hasOwnProperty('port')) {
            this._connection_settings.options.port = settings.port;
            delete settings.port;
        }

        // Remove mapped connection settings:
        delete settings.host;
        delete settings.user;
        delete settings.password;

        // Set default pool settings
        this.pool_settings = {
            min: 10,
            max: 10,
            acquireTimeout: 60000,
            log: this.debugging,
        };

        // Override default pool settings
        if (settings.hasOwnProperty('pool_size')) {
            this.pool_settings.max = settings.pool_size;
            delete settings.pool_size;
        }
        if (settings.hasOwnProperty('pool_min')) {
            this.pool_settings.min = settings.pool_min;
            delete settings.pool_min;
        }
        if (settings.hasOwnProperty('acquireTimeout')) {
            this.pool_settings.acquireTimeout = settings.acquireTimeout;
            delete settings.acquireTimeout;
        }


        if (settings.hasOwnProperty('options') && typeof settings.options === 'object') {
            let options = this._connection_settings.options;
            options = Object.assign(options, settings.options);
            options.debug = this._connection_settings.options.debug;
            this._connection_settings.options = options;
            delete settings.options;
        }

        // Merge any additional driver-specific settings into connection settings
        this._connection_settings = Object.assign(this._connection_settings, settings);
    }

    // ****************************************************************************
    // Try to load the driver's query builder library and modify QueryBuilder object
    // -----
    // @param   Object  qb    The QueryBuilder object
    // @return  Object        QueryBuilder object
    // ****************************************************************************
    get_query_builder() {
        try {
            return require('./query_builder.js').QueryBuilder();
        } catch(e) {
            throw new Error(`Couldn't load the QueryBuilder library for ${this.nqb.driver}: ${e}`);
        }
    }

    // ****************************************************************************
    // Get the the driver's QueryExec object so that queries can actually be
    // executed by this library.
    // -----
    // @param   Object  qb      The QueryBuilder object
    // @param   Object  conn    The Connnection object
    // @return  Object          QueryExec Object
    // ****************************************************************************
    get_query_exec(qb, conn) {
        try {
            return require('./query_exec.js').QueryExec(qb, conn);
        } catch(e) {
            throw new Error(`Couldn't load the QueryExec library for ${this.nqb.driver}: ${e}`);
        }
    }
}


// ****************************************************************************
// Generic Single Adapter
// -----
// @return    Object        Single Adapter object
// ****************************************************************************
class Single extends Adapter {
    constructor(nqb, settings) {
        super(nqb);

        // Set defaults
        this.pool = null;
        this._connection = null;

        // If the Pool object is instatiating this Adapter, use it's connection
        if (settings && settings.pool) {
            this.pool = settings.pool.pool;
            this._connection = settings.pool.connection;
        }
        // Otherwise, let's create a new connection
        else {
            const self = this;
            function SQLConnection() {};
            SQLConnection.prototype.connect = function(callback) {
                this.connection = new Connection(self._connection_settings);
                this.connection.on('error', callback);
                this.connection.on('connect', callback);
                return this.connection;
            }
            this.sql_connection = new SQLConnection();
        }

        this.qb = this.get_query_builder();
        this.qe = this.get_query_exec(this.qb, this.sql_connection);

        const self = this;

        return Object.assign({
            connection_settings: function() {
                return {connection_settings: self._connection_settings, pool_settings: self.pool_settings};
            },

            connect: function(callback) {
                if (self._connection) return self._connection;
                self._connection = self.sql_connection.connect(callback);
            },

            connection: function() {
                return self._connection;
            },

            escape: function(str) {
                throw new Error("The `escape` method is not supported with the mssql driver!");
            },

            escape_id: function(str) {
                throw new Error("The `escape` method is not supported with the mssql driver!");
            },

            disconnect: function(callback) {
                if (self.pool) {
                    self.pool.drain();
                } else {
                    self._connection.close();
                }
                if (callback && typeof callback === 'function') callback(null);
            },

            release: function() {
                if (!self.pool) throw new Error("You cannot release a non-pooled connection from a connection pool!");
                self.pool.release(self._connection);
            }
        }, self.qb, self.qe);
    }
}

// ****************************************************************************
// Connection Pool Adapter
// -----
// @return    Object        Adapter object
// ****************************************************************************
class Pool extends Adapter {
    constructor(nqb) {
        super(nqb);

        // Create pool for node-querybuilder object if it doesn't already have one.
        if (!this.nqb.hasOwnProperty('pool') || this.nqb.pool.length === 0) {
            // Create connection Pool
            const ps = Object.assign({}, this.pool_settings);
            const cs = Object.assign({}, this._connection_settings);
            this.nqb.pool = new ConnectionPool(ps, cs);
            this.nqb.pool.on('error', err => {
                if (this.debugging === true) console.error(err);
            });
        }

        const self = this;

        return {
            pool: function() {
                return self.nqb.pool;
            },
            get_connection: function(callback) {
                if (self.nqb.pool === null) {
                    const error_msg = "Connection pool not available!";
                    if (self.debugging === true) console.error(error_msg);
                    throw new Error(error_msg);
                }

                self.nqb.pool.acquire((err, connection) => {
                    if (err) throw err;
                    const adapter = new Single(self.nqb, {
                        pool: {
                            pool: self.nqb.pool,
                            connection: connection,
                        }
                    });

                    callback(adapter);
                });

            },
            disconnect: function(callback) {
                self.nqb.pool.drain(callback);
            }
        }
    }
}

// ****************************************************************************
// Clustered Connection Pool Adapter
// -----
// @return    Object        Adapter object
// ****************************************************************************
class Cluster extends Adapter {
    constructor(nqb) {
        super(nqb);
        return {};
    }
}

exports.Adapters = {Single,Pool,Cluster};
