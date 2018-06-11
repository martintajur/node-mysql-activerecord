const mssql = require('mssql');
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
        if (this.nqb.settings.hasOwnProperty('qb_debug') && this.nqb.settings.qb_debug === true) {
            this.debugging = true;
            delete this.nqb.settings.qb_debug;
        }

        // Verify that required fields are provided...
        if (Object.keys(this.nqb.settings).length === 0) throw new Error("No connection information provided!");
        if (!this.nqb.settings.hasOwnProperty('host')) this.nqb.settings.host = 'localhost';
        if (!this.nqb.settings.hasOwnProperty('user')) throw new Error("No user property provided. Hint: It can be NULL");
        //if (!nqb.settings.hasOwnProperty('password')) throw new Error("No connection password provided. Hint: It can be NULL");

        this.map_connection_settings();
    }

    // ****************************************************************************
    // Map generic NQB connection settings to mssql's format
    // ****************************************************************************
    map_connection_settings() {
        this.connection_settings = {
            server: this.nqb.settings.host,
            user: this.nqb.settings.user,
            password: this.nqb.settings.password
        }
        if (this.nqb.settings.hasOwnProperty('database')) {
            this.connection_settings.database = this.nqb.settings.database;
            delete this.nqb.settings.database
        }
        if (this.nqb.settings.hasOwnProperty('port')) {
            this.connection_settings.port = this.nqb.settings.port;
            delete this.nqb.settings.port
        }

        // Remove mapped settings:
        delete this.nqb.settings.host
        delete this.nqb.settings.user
        delete this.nqb.settings.password

        // Merge any driver-specific settings into connection settings
        this.connection_settings = Object.assign(this.connection_settings, this.nqb.settings);
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
            throw new Error("Couldn't load the QueryBuilder library for " + this.nqb.driver + ": " + e);
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
            throw new Error("Couldn't load the QueryExec library for " + this.nqb.driver + ": " + e);
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
            this._connection = mssql.connect(this.connection_settings);
        }

        this.qb = this.get_query_builder();
        this.qe = this.get_query_exec(this.qb, this._connection);

        const self = this;

        return Object.assign({
            connection_settings: function() {
                return self.connection_settings;
            },

            connect: function(callback) {
                return self._connection.then(err => {
                    return callback(err);
                });
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
                return self.connection.end(callback);
            },

            release: function() {
                if (!self.pool) throw new Error("You cannot release a non-pooled connection from a connection pool!");
                self.pool.releaseConnection(self.connection);
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
            this.nqb.pool = new mssql.ConnectionPool(this.connection_settings, err => {
                if (this.debugging === true) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('mssql connection pool created');
                    }
                }
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

                self.nqb.pool.getConnection((err, connection) => {
                    if (err) throw err;
                    const adapter = new Single(nqb, {
                        pool: {
                            pool: self.nqb.pool,
                            connection: connection
                        }
                    });

                    callback(adapter);
                });
            },
            disconnect: function(callback) {
                self.nqb.pool.close(callback);
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
