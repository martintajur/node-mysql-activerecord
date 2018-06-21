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
    // Map generic NQB connection settings to node-mysql's format
    // ----
    // NOTE: MySQL connection settings names are the same as Node Querybuilder,
    // it's just good practice to go ahead and do this in case things change.
    // ****************************************************************************
    map_connection_settings() {
        const settings = JSON.parse(JSON.stringify(this._connection_settings));

        this._connection_settings = {
            host: settings.host,
            user: settings.user,
            password: settings.password,
        };

        if (settings.hasOwnProperty('database')) {
            this._connection_settings.database = settings.database;
            delete settings.database;
        }
        if (settings.hasOwnProperty('port')) {
            this._connection_settings.port = settings.port;
            delete settings.port;
        }

        // Remove mapped settings:
        delete settings.host;
        delete settings.user;
        delete settings.password;

        // Merge any driver-specific settings into connection settings
        this._connection_settings = Object.assign(this._connection_settings, settings);
    }
}

module.exports = Adapter;
