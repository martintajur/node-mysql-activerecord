/**
 * QueryBuilder for Node.js
 * (C) Kyle Farris 2014
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
var QueryBuilder = function(settings,driver,type) {
	
	this.settings = settings || {};
	this.driver = driver || 'mysql';
	this.connection_type = type || 'single';
	this.drivers = require('./drivers/drivers.json');
	this.driver_version = 'default';
	this.driver_info = null;
	this.connection = null;
	this.qb = null;
	this.qe = null;
	this.adapter = null;
	
	// ****************************************************************************
	// Get information about the driver the user wants to use and modify QB object
	// -----
	// @param	Object	qb	The QueryBuilder object
	// @return	Object		Modified QueryBuilder object
	// ****************************************************************************
	var get_driver_info = function(qb) {
		// A driver must be specified
		if (typeof driver !== 'string') {
			throw new Error("No database driver specified!");
		}
		
		qb.driver = driver.toLowerCase();
		
		// Verify that the driver is one we fundamentally support
		if (Object.keys(qb.drivers).indexOf(qb.driver) === -1) {
			throw new Error("Invalid driver specified!");
		}
		
		// Determine version of driver to use
		if (qb.settings.hasOwnProperty('version') && (typeof qb.settings.version).match(/^(string|number)$/i)) {
			qb.driver_version = qb.settings.version;
			delete qb.settings.version;
		}
		
		// Retrieve info about driver if available, error if not
		if (Object.keys(qb.drivers[qb.driver].versions).indexOf(qb.driver_version) !== -1) {
			qb.driver_info = qb.drivers[qb.driver].versions[qb.driver_version];
		} else {
			throw new Error(qb.driver_version + " is not a version of the " + qb.driver + " driver that this library specifically supports. Try being more generic.");
		}
		
		// Fail if specified driver is inactive
		if (qb.driver_info.active === false) {
			var err = (qb.driver_version == 'default' ? 'The default version' : "Version " + qb.driver_version) 
					+ " of the " + qb.driver + " driver you are attempting to load is not currently available!";
			throw new Error(err);
		}
	};
	get_driver_info(this);
	
	// ****************************************************************************
	// Try to load the driver's query builder library and modify QueryBuilder object
	// -----
	// @param	Object	qb	The QueryBuilder object
	// @return	Object		Modified QueryBuilder object
	// ****************************************************************************
	var get_query_builder = function(qb) {
		try {
			qb.qb = require(qb.driver_info.path + 'query_builder.js').QueryBuilder();
		} catch(e) {
			throw new Error("Couldn't load the QueryBuilder library for " + qb.driver + ": " + e);
		}
		return qb;
	};
	get_query_builder(this);
	
	// Non-Public QueryBuilder APIs
	this._where				= this.qb._where;
	this._where_in			= this.qb._where_in;
	this._like				= this.qb._like;
	this._min_max_avg_sum	= this.qb._min_max_avg_sum;
	this._having			= this.qb._having;
	this._update			= this.qb._update;
	this.reset_query		= this.qb.reset_query;
	
	// QueryBuilder Properties
	this.where_array		= this.qb.where_array;
	this.where_in_array		= this.qb.where_in_array;
	this.from_array			= this.qb.from_array;
	this.join_array			= this.qb.join_array;
	this.select_array		= this.qb.select_array;
	this.set_array			= this.qb.set_array;
	this.order_by_array		= this.qb.order_by_array;
	this.group_by_array		= this.qb.group_by_array;
	this.having_array		= this.qb.having_array;
	this.limit_to			= this.qb.limit_to;
	this.offset_val			= this.qb.offset_val;
	this.join_clause		= this.qb.join_clause;
	this.last_query_string	= this.qb.last_query_string;
	this.distinct_clause	= this.qb.distinct_clause;
	this.aliased_tables		= this.qb.aliased_tables;
	
	// QueryBuilder method mappings
	this.where 			 	= this.qb.where;
	this.or_where 		 	= this.qb.or_where;
	this.where_in 		 	= this.qb.where_in;
	this.or_where_in	 	= this.qb.or_where_in;
	this.where_not_in 	 	= this.qb.where_not_in;
	this.or_where_not_in	= this.qb.or_where_not_in;
	this.like 			 	= this.qb.like;
	this.not_like 		 	= this.qb.not_like;
	this.or_like		 	= this.qb.or_like;
	this.or_not_like 	 	= this.qb.or_not_like;
	this.from 			 	= this.qb.from;
	this.join 			 	= this.qb.join;
	this.select 		 	= this.qb.select;
	this.select_min 	 	= this.qb.select_min;
	this.select_max 	 	= this.qb.select_max;
	this.select_avg 	 	= this.qb.select_avg;
	this.select_sum 	 	= this.qb.select_sum;
	this.distinct 		 	= this.qb.distinct;
	this.group_by 		 	= this.qb.group_by;
	this.having 		 	= this.qb.having;
	this.or_having 		 	= this.qb.or_having;
	this.order_by 		 	= this.qb.order_by;
	this.limit 			 	= this.qb.limit;
	this.offset 		 	= this.qb.offset;
	this.set				= this.qb.set;
	this.get_compiled_select = this.qb.get_compiled_select;
	this.get_compiled_insert = this.qb.get_compiled_insert;
	this.get_compiled_update = this.qb.get_compiled_update;
	this.get_compiled_delete = this.qb.get_compiled_delete;
	this.last_query 	 	= this.qb._last_query;
	
	// ****************************************************************************
	// Determine the type of connection (single, pool, cluster, etc...)
	// -----
	// @param	Object	qb	The QueryBuilder object
	// @return	Object		Modified QueryBuilder object
	// ****************************************************************************
	var get_connection_type = function(qb) {
		if (Object.keys(qb.drivers[qb.driver].connection_types).indexOf(qb.connection_type) === -1) {
			throw new Error("You have specified a invalid database connection method: " + qb.connection_type);
		}
		if (qb.drivers[qb.driver].connection_types[qb.connection_type] !== true) {
			throw new Error("You cannot connect to a " + qb.driver + " database using the " + qb.connection_type + " connection type using this library.");
		}
		return qb;
	}
	get_connection_type(this);
	
	// ****************************************************************************
	// Try to create a connection to the database using the driver's connection library
	// -----
	// @param	Object	qb	The QueryBuilder object
	// @return	Object		Modified QueryBuilder object
	// ****************************************************************************
	var get_adapter = function(qb) {
		try {
			qb.adapter = require(qb.driver_info.path + 'connect.js').Adapter(qb.settings, qb.connection_type);
		} catch(e) {
			throw new Error("Could not connect to database: " + e);
		}
		
		if (!qb.adapter.hasOwnProperty(qb.connection_type)) {
			throw new Error('"' + qb.connection_type + '" is an invalid connection type for ' + qb.driver + '!');
		}
		
		// Create connection
		qb.adapter[qb.connection_type]();
		qb.adapter.get_connection(function(connection) {
			this.connection = connection;
			return qb;
		});
	}
	get_adapter(this);
	
	this.disconnect = this.adapter.disconnect;
	this.destroy = this.adapter.destroy;
	this.escape = this.adapter.escape;
	this.get_connection_id = this.adapter.get_connection_id;
	
	// ****************************************************************************
	// Get the the driver's QueryExec object so that queries can actually be
	// executed by this library.
	// -----
	// @param	Object	qb	The QueryBuilder object
	// @return	Object		Modified QueryBuilder object
	// ****************************************************************************
	var get_query_exec = function(qb) {
		try {
			qb.qe = require(qb.driver_info.path + 'query_exec.js').QueryExec(qb.qb, qb.adapter);
		} catch(e) {
			throw new Error("Couldn't load the QueryExec library for " + qb.driver + ": " + e);
		}
		return qb;
	};
	get_query_exec(this);
	
	// QueryExecute method mappings:
	this.query 			= this.qe.query;
	this.count 			= this.qe.count;
	this.get 			= this.qe.get;
	this.get_where 		= this.qe.get_where;
	this.insert			= this.qe.insert;
	this.insert_ignore 	= this.qe.insert_ignore;
	this.insert_batch 	= this.qe.insert_batch;
	this.update 		= this.qe.insert_batch;
	this.update_batch 	= this.qe.update_batch;
	this.delete 		= this.qe.delete;
	this.empty_table	= this.qe.empty_table;
	this.truncate		= this.qe.truncate;
	
	var that = this;	
	return this;
};

exports.QueryBuilder = QueryBuilder;