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
        const nqb_settings = JSON.parse(JSON.stringify(this._connection_settings));

        this._connection_settings = {
            host: nqb_settings.host,
            user: nqb_settings.user,
            password: nqb_settings.password,
        };

        if (nqb_settings.hasOwnProperty('database')) {
            this._connection_settings.database = nqb_settings.database;
            delete nqb_settings.database;
        }
        if (nqb_settings.hasOwnProperty('port')) {
            this._connection_settings.port = nqb_settings.port;
            delete nqb_settings.port;
        }
        
        // Remove mapped settings:
        delete nqb_settings.host;
        delete nqb_settings.user;
        delete nqb_settings.password;

        // Merge any driver-specific settings into connection settings
        this._connection_settings = Object.assign(this._connection_settings, nqb_settings);
    }
}

module.exports = Adapter;
