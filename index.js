/**
 * QueryBuilder for Node.js
 * (C) Kyle Farris 2014-2015
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
const lo_assign = require('lodash.assign');
const QueryBuilder = (settings,driver,type) => {

	this.settings = (settings ? lo_assign({}, settings) : {});
	this.driver = driver || 'mysql';
	this.connection_type = type || 'single';
	this.drivers = require('./drivers/drivers.json');
	this.driver_version = 'default';
	this.driver_info = null;
	this.pool = [];

	// ****************************************************************************
	// Get information about the driver the user wants to use and modify QB object
	// -----
	// @param	Object	qb	The QueryBuilder object
	// @return	Object		Modified QueryBuilder object
	// ****************************************************************************
	const get_driver_info = qb => {
		// A driver must be specified
		if (typeof this.driver !== 'string') {
			throw new Error("No database driver specified!");
		}

		qb.driver = qb.driver.toLowerCase();

		// Verify that the driver is one we fundamentally support
		if (Object.keys(qb.drivers).indexOf(qb.driver) === -1) {
			throw new Error("Invalid driver specified!");
		}

		// Determine version of driver to use
		if (qb.settings.hasOwnProperty('version') && /^(string|number)$/i.test(typeof qb.settings.version)) {
			qb.driver_version = qb.settings.version;
			delete qb.settings.version;
		}

		// Retrieve info about driver if available, error if not
		if (qb.drivers[qb.driver].versions.hasOwnProperty(qb.driver_version)) {
			if (qb.drivers[qb.driver].versions[qb.driver_version].hasOwnProperty('version')) {
				qb.driver_info = qb.drivers[qb.driver].versions[qb.drivers[qb.driver].versions[qb.driver_version].version];
			} else {
				qb.driver_info = qb.drivers[qb.driver].versions[qb.driver_version];
			}
		} else {
			throw new Error(qb.driver_version + " is not a version of the " + qb.driver + " driver that this library specifically supports. Try being more generic.");
		}

		// Fail if specified driver is inactive
		if (qb.driver_info.active === false) {
			const err = (qb.driver_version == 'default' ? 'The default version' : "Version " + qb.driver_version)
					+ " of the " + qb.driver + " driver you are attempting to load is not currently available!";
			throw new Error(err);
		}
	};
	get_driver_info(this);

	// ****************************************************************************
	// Determine the type of connection (single, pool, cluster, etc...)
	// -----
	// @param	Object	qb	The QueryBuilder object
	// @return	Object		Modified QueryBuilder object
	// ****************************************************************************
	const get_connection_type = qb => {
		if (!Object.keys(qb.drivers[qb.driver].connection_types).includes(qb.connection_type)) {
			throw new Error("You have specified a invalid database connection method: " + qb.connection_type);
		}
		if (qb.drivers[qb.driver].connection_types[qb.connection_type] !== true) {
			throw new Error("You cannot connect to a " + qb.driver + " database using the " + qb.connection_type + " connection type using this library.");
		}
		return qb;
	}
	get_connection_type(this);

	// ****************************************************************************
	// Returns the single, pool, or cluster adapter
	// -----
	// @return	VOID	This method responds asychronously via a callback
	// ****************************************************************************
	const get_adapter = qb => {
		try {
			const adapter = require(qb.driver_info.path + 'adapters.js').Adapters(qb);
			return adapter;
		} catch(e) {
			throw new Error("Couldn't load the Connection library for " + qb.driver + "(" + JSON.stringify(qb.settings) + "): " + e);
		}
	};

	return get_adapter(this);
};

exports.QueryBuilder = QueryBuilder;
