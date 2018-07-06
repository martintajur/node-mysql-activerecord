/**
 * QueryBuilder for Node.js
 * (C) Kyle Farris 2014-2018
 * kyle@chomponllc.com
 *
 * A generic Query Builder for any SQL or NOSQL database adapter.
 *
 * Current adapters:
 * - MySQL
 *
 * Requested Adapters:
 * - MSSQL
 * - postgres
 * - sqlite
 * - sqlite3
 * - oracle
 * - mongo
 *
 * Dual licensed under the MIT and GPL licenses.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL KEVIN VAN ZONNEVELD BE LIABLE FOR ANY CLAIM, DAMAGES
 * OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
**/
class QueryBuilder {
    constructor(settings, driver, type) {
        this.settings = (settings ? Object.assign({}, settings) : {});
        this.driver = driver || 'mysql';
        this.connection_type = type || 'single';
        this.drivers = require('./drivers/drivers.json');
        this.driver_version = 'default';
        this.driver_info = null;
        this.pool = [];

        this.get_driver_info();
        this.get_connection_type();
        return this.get_adapter();
    }

    // ****************************************************************************
    // Get information about the driver the user wants to use and modify QB object
    // -----
    // @return    Object        Modified QueryBuilder object
    // ****************************************************************************
    get_driver_info() {
        // A driver must be specified
        if (typeof this.driver !== 'string') {
            throw new Error("No database driver specified!");
        }

        this.driver = this.driver.toLowerCase();

        // Verify that the driver is one we fundamentally support
        if (Object.keys(this.drivers).indexOf(this.driver) === -1) {
            throw new Error("Invalid driver specified!");
        }

        // Determine version of driver to use
        if (this.settings.hasOwnProperty('version') && /^(string|number)$/i.test(typeof this.settings.version)) {
            this.driver_version = this.settings.version;
            delete this.settings.version;
        }

        // Retrieve info about driver if available, error if not
        if (this.drivers[this.driver].versions.hasOwnProperty(this.driver_version)) {
            if (this.drivers[this.driver].versions[this.driver_version].hasOwnProperty('version')) {
                this.driver_info = this.drivers[this.driver].versions[this.drivers[this.driver].versions[this.driver_version].version];
            } else {
                this.driver_info = this.drivers[this.driver].versions[this.driver_version];
            }
        } else {
            throw new Error(`${this.driver_version} is not a version of the ${this.driver} driver that this library specifically supports. Try being more generic.`);
        }

        // Fail if specified driver is inactive
        if (this.driver_info.active === false) {
            const err = (this.driver_version == 'default' ? 'The default version' : "Version " + this.driver_version)
                    + ` of the ${this.driver} driver you are attempting to load is not currently available!`;
            throw new Error(err);
        }
    }

    // ****************************************************************************
    // Determine the type of connection (single, pool, cluster, etc...)
    // -----
    // @return    Object        Modified QueryBuilder object
    // ****************************************************************************
    get_connection_type() {
        if (!Object.keys(this.drivers[this.driver].connection_types).includes(this.connection_type)) {
            throw new Error(`You have specified a invalid database connection method: ${this.connection_type}`);
        }
        if (this.drivers[this.driver].connection_types[this.connection_type] !== true) {
            throw new Error(`You cannot connect to a ${this.driver} database using the ${this.connection_type} connection type using this library.`);
        }
        return this;
    }

    // ****************************************************************************
    // Returns the single, pool, or cluster adapter
    // -----
    // @return    VOID    This method responds asychronously via a callback
    // ****************************************************************************
    get_adapter() {
        const settings = Object.assign({}, this.settings);

        let Single;

        try {
            switch (this.connection_type) {
                case 'cluster':
                    const Cluster = require(`${this.driver_info.path}/adapters/cluster.js`);
                    return new Cluster(settings);
                case 'pool':
                    const Pool = require(`${this.driver_info.path}/adapters/pool.js`)
                    return new Pool(settings);
                case 'single':
                    Single = require(`${this.driver_info.path}/adapters/single.js`)
                    return new Single(settings, {});
                default:
                    Single = require(`${this.driver_info.path}/adapters/single.js`)
                    return new Single(settings, {});
            }
        } catch(e) {
            throw new Error(`Couldn't load the "${this.connection_type}" Adapter library for ${this.driver} (${JSON.stringify(this.settings)}): ${e}`);
        }
    }
}

module.exports = QueryBuilder;
