const Adapters = function(nqb) {
    // Load MySQL Driver
    const mysql = require('mysql');

    // Verify setting property exists
    if (!nqb.hasOwnProperty('settings')) {
        throw new Error("No connection settings provided to initialize QueryBuilder!");
    }

    // Enable debugging if necessary
    this.debugging = false;
    if (nqb.settings.hasOwnProperty('qb_debug') && nqb.settings.qb_debug === true) {
        this.debugging = true;
        delete nqb.settings.qb_debug;
    }

    // Verify that required fields are provided...
    if (Object.keys(nqb.settings).length === 0) throw new Error("No connection information provided!");
    if (!nqb.settings.hasOwnProperty('host')) nqb.settings.host = 'localhost';
    if (!nqb.settings.hasOwnProperty('user')) throw new Error("No user property provided. Hint: It can be NULL");
    //if (!nqb.settings.hasOwnProperty('password')) throw new Error("No connection password provided. Hint: It can be NULL");

    this.connection_settings = {};
    const that = this;

    // ****************************************************************************
    // Map generic NQB connection settings to node-mysql's format
    // ----
    // NOTE: MySQL connection settings names are the same as Node Querybuilder,
    // it's just good practice to go ahead and do this in case things change.
    // ****************************************************************************
    const map_connection_settings = () => {
        this.connection_settings = {
            host: nqb.settings.host,
            user: nqb.settings.user,
            password: nqb.settings.password
        }
        if (nqb.settings.hasOwnProperty('database')) {
            this.connection_settings.database = nqb.settings.database;
            delete nqb.settings.database
        }
        if (nqb.settings.hasOwnProperty('port')) {
            this.connection_settings.port = nqb.settings.port;
            delete nqb.settings.port
        }

        // Remove mapped settings:
        delete nqb.settings.host
        delete nqb.settings.user
        delete nqb.settings.password

        // Merge any driver-specific settings into connection settings
        this.connection_settings = Object.assign(this.connection_settings, nqb.settings);
    }

    map_connection_settings();


    // ****************************************************************************
    // Try to load the driver's query builder library and modify QueryBuilder object
    // -----
    // @param    Object    qb    The QueryBuilder object
    // @return    Object        QueryBuilder object
    // ****************************************************************************
    const get_query_builder = () => {
        try {
            return require('./query_builder.js').QueryBuilder();
        } catch(e) {
            throw new Error("Couldn't load the QueryBuilder library for " + nqb.driver + ": " + e);
        }
    };

    // ****************************************************************************
    // Get the the driver's QueryExec object so that queries can actually be
    // executed by this library.
    // -----
    // @param    Object    qb        The QueryBuilder object
    // @param    Object    conn    The Connnection object
    // @return    Object            QueryExec Object
    // ****************************************************************************
    const get_query_exec = (qb, conn) => {
        try {
            return require('./query_exec.js').QueryExec(qb, conn);
        } catch(e) {
            throw new Error("Couldn't load the QueryExec library for " + nqb.driver + ": " + e);
        }
    };

    // ****************************************************************************
    // Generic Single Adapter
    // -----
    // @return    Object        Adapter object
    // ****************************************************************************
    const Adapter = function(settings) {
        let pool, connection;

        // If the Pool object is instatiating this Adapter, use it's connection
        if (settings && settings.pool) {
            pool = settings.pool.pool;
            connection = settings.pool.connection;
        }
        // Otherwise, let's create a new connection
        else {
            connection = new mysql.createConnection(that.connection_settings);
        }

        const qb = get_query_builder();
        const qe = get_query_exec(qb, connection);

        const adapter = Object.assign({
            connection_settings: function() {
                return that.connection_settings;
            },

            connect: function(callback) {
                return connection.connect(callback);
            },

            connection: function() {
                return connection;
            },

            escape: function(str) {
                return connection.escape(str);
            },

            escape_id: function(str) {
                return connection.escapeId(str);
            },

            disconnect: function(callback) {
                return connection.end(callback);
            },

            release: function() {
                if (!pool) throw new Error("You cannot release a non-pooled connection from a connection pool!");
                pool.releaseConnection(connection);
            }
        }, qb, qe);

        return adapter;
    };

    // ****************************************************************************
    // Connection Pool Adapter
    // -----
    // @return    Object        Adapter object
    // ****************************************************************************
    const Pool = function() {
        // Return Pool Object
        const return_pool = () => {
            return {
                pool: function() {
                    return nqb.pool;
                },
                get_connection: function(callback) {
                    if (null === nqb.pool) {
                        const error_msg = "Connection pool not available!";
                        if (console && console.hasOwnProperty('error')) console.error(error_msg);
                        throw new Error(error_msg);
                    }

                    nqb.pool.getConnection((err, connection) => {
                        if (err) throw err;
                        const adapter = new Adapter({
                            pool: {
                                pool: nqb.pool,
                                connection: connection
                            }
                        });

                        callback(adapter);
                    });
                },
                disconnect: function(callback) {
                    nqb.pool.end(callback);
                }
            }
        };

        // Create pool for node-querybuild object if it doesn't already have one.
        if (!nqb.hasOwnProperty('pool') || nqb.pool.length === 0) {
            // Create connection Pool
            nqb.pool = mysql.createPool(that.connection_settings);

            // Test connection pool (asynchronous -- this shouldn't prevent the pool from initially loading)
            if (that.debugging === true) {
                nqb.pool.getConnection((err, connection) => {
                    connection.query('SELECT 1 + 1 AS solution', (err) => {
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
        return return_pool();
    };

    // ****************************************************************************
    // Clustered Connection Pool Adapter
    // -----
    // @return    Object        Adapter object
    // ****************************************************************************
    const Cluster = () => {

    };

    // ****************************************************************************
    // Basic Description
    // -----
    // @param
    // @return
    // ****************************************************************************
    const determine_adapter = () => {
        switch(nqb.connection_type) {
            case 'cluster':
                return new Cluster();
            case 'pool':
                return new Pool();
            case 'single':
            default:
                return new Adapter({});
        }
    }

    return determine_adapter();
};

exports.Adapters = Adapters;
