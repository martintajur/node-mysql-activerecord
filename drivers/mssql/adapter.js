const QueryExec = require('./query_exec');

class Adapter extends QueryExec {
    constructor(settings) {
        super(settings);

        // Verify that an instance of Node QueryBuilder was passed in
        if (!settings || typeof settings !== 'object') {
            throw new Error("No connection settings provided to initialize QueryBuilder!");
        }

        this._original_settings = settings;
        this._connection_settings = settings;

        // Enable debugging if necessary
        this.debugging = false;
        if (this._connection_settings.hasOwnProperty('debug') && this._connection_settings.debug === true) {
            this.debugging = true;
            delete this._connection_settings.debug;
        }

        // Verify that required fields are provided...
        if (Object.keys(this._connection_settings).length === 0) throw new Error("No connection information provided!");
        if (!this._connection_settings.hasOwnProperty('host')) this._connection_settings.host = 'localhost';
        if (!this._connection_settings.hasOwnProperty('user')) { console.log("Settings:", this._connection_settings); throw new Error("No user property provided. Hint: It can be NULL"); }

        this.map_connection_settings();
    }

    // ****************************************************************************
    // Map generic NQB connection settings to mssql's format
    // ****************************************************************************
    map_connection_settings() {
        const settings = Object.assign({}, this._connection_settings);

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
}

module.exports = Adapter;
