/**
 * MySQL ActiveRecord Adapter for Node.js
 * (C) Martin Tajur 2011-2013
 * martin@tajur.ee
 * 
 * Active Record Database Pattern implementation for use with node-mysql as MySQL connection driver.
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

var Adapter = function(settings) {

	var mysql = require('mysql');

	var initializeConnectionSettings = function () {
		if(settings.server) {
			settings.host = settings.server;
		}
		if(settings.username) {
			settings.user = settings.username;
		}

		if (!settings.host) {
			throw new Error('Unable to start ActiveRecord - no server given.');
		}
		if (!settings.port) {
			settings.port = 3306;
		}
		if (!settings.user) {
			settings.user = '';
		}
		if (!settings.password) {
			settings.password = '';
		}
		if (!settings.database) {
			throw new Error('Unable to start ActiveRecord - no database given.');
		}

		return settings;
	};

	var connection;
	var connectionSettings;
	var pool;

	if (settings && settings.pool) {
		pool = settings.pool.pool;
		connection = settings.pool.connection;
	} else {
		connectionSettings = initializeConnectionSettings();
		connection = new mysql.createConnection(connectionSettings);
	}

	if (settings.charset) {
		connection.query('SET NAMES ' + settings.charset);
	}

	var whereClause = {},
		whereArray = [],
		selectClause = [],
		orderByClause = '',
		groupByClause = '',
		havingClause = '',
		limitClause = -1,
		offsetClause = -1,
		joinClause = [],
		lastQuery = '';
		distinctClause = '',
		aliasedTables = []
	
	var resetQuery = function(newLastQuery) {
		whereArray = [];
		whereClause = {};
		selectClause = [];
		orderByClause = '';
		groupByClause = '';
		havingClause = '',
		limitClause = -1;
		offsetClause = -1;
		joinClause = [];
		lastQuery = (typeof newLastQuery === 'string' ? newLastQuery : '');
		distinctClause = '';
		rawWhereClause = {};
		rawWhereString = {};
		aliasedTables = [];
	};
	
	var rawWhereClause = {};
	var rawWhereString = {};
	
	var trackAliases = function(table) {
		if (Object.prototype.toString.call(table) === Object.prototype.toString.call({})) {
			for (var i in table) {
				var t = table[i];
				track_aliases(t);
			}
			return;
		}

		// Does the string contain a comma?  If so, we need to separate
		// the string into discreet statements
		if (table.indexOf(',') !== -1) {
			return track_aliases(table.split(','));
		}

		// if a table alias is used we can recognize it by a space
		if (table.indexOf(' ') !== -1) {
			// if the alias is written with the AS keyword, remove it
			table = table.replace(/\s+AS\s+/gi, ' ');
			
			// Grab the alias
			alias = table.slice(table.lastIndexOf(' ')).trim();

			// Store the alias, if it doesn't already exist
			if(aliasedTables.indexOf(table) == -1) {
				aliasedTables.push(table);
			}
		}
	}
	
	var escapeIdentifiers = function(item) {
		if (!item || item === '*') {
			return item;
		}
		
		var str;
		if (item.indexOf('.') !== -1) {
			str = '`' + item.replace(/\./g,'`.`') + '`';
		}
		else {
			str = '`' + item + '`';
		}
		
		// remove duplicates if the user already included the escape
		return str.replace(/[`]+/,'`');
	}
	
	var protectIdentifiers = function(item,escape) {
		escape = (typeof escape === 'boolean' ? escape : true);
		
		if(Object.prototype.toString.call(item) === Object.prototype.toString.call({})) {
			var escaped_array = {};

			for (k in item) {
				var v = item[k];
				escaped_array[protectIdentifiers(k)] = protectIdentifiers(v);
			}

			return escaped_array;
		}
		
		// Convert tabs or multiple spaces into single spaces
		item = item.replace(/\s+/, ' ');
		
		// If the item has an alias declaration we remove it and set it aside.
		// Basically we remove everything to the right of the first space
		if (item.indexOf(' ') !== -1) {
			var alias_index = item.lastIndexOf(' ');
			var alias = item.slice(alias_index);
			item = item.slice(0,alias_index);
		}
		else {
			alias = '';
		}
		
		// This is basically a bug fix for queries that use MAX, MIN, etc.
		// If a parenthesis is found we know that we do not need to
		// escape the data or add a prefix.
		if (item.indexOf('(') !== -1) {
			return item + alias;
		}
		
		// Break the string apart if it contains periods, then insert the table prefix
		// in the correct location, assuming the period doesn't indicate that we're dealing
		// with an alias. While we're at it, we will escape the components
		if (item.indexOf('.') !== -1) {
			parts	= item.split('.');

			// Does the first segment of the exploded item match
			// one of the aliases previously identified?  If so,
			// we have nothing more to do other than escape the item
			if (aliasedTables.indexOf(parts[0]) !== -1) {
				if (escape === true) {
					for (var key in parts) {
						var val = parts[key];
						if (val !== '*') {
							parts[key] = escapeIdentifiers(val);
						}
					}

					item = parts.join('.');
				}
				return item + alias;
			}

			if (escape === true) {
				item = escapeIdentifiers(item);
			}

			return item + alias;
		}
		if (escape === true) {
			item = escapeIdentifiers(item);
		}
		
		return item + alias;
	};
	
	var buildWhereClause = function() {
		var sql = '';
		if(whereArray.length > 0 || this.like_array.length > 0) {
			sql += " WHERE ";
		}
		sql += whereArray.join(" ");
		return sql;
	}
	
	var buildDataString = function(dataSet, separator, clause) {
		if (!clause) {
			clause = 'WHERE';
		}
		var queryString = '', y = 1;
		if (!separator) {
			separator = ', ';
		}
		var useSeparator = true;
		
		var datasetSize = getObjectSize(dataSet);
		
		for (var key in dataSet) {
			useSeparator = true;
			
			if (dataSet.hasOwnProperty(key)) {
				if (clause == 'WHERE' && rawWhereString[key] == true) {
					queryString += key;
				}
				else if (dataSet[key] === null) {
					queryString += protectIdentifiers(key) + (clause == 'WHERE' ? " is NULL" : "=NULL");
				}
				else if (typeof dataSet[key] !== 'object') {
					queryString += protectIdentifiers(key) + "=" + connection.escape(dataSet[key]);
				}
				else if (typeof dataSet[key] === 'object' && Object.prototype.toString.call(dataSet[key]) === '[object Array]' && dataSet[key].length > 0) {
					queryString += protectIdentifiers(key) + ' in ("' + dataSet[key].join('", "') + '")';
				}
				else {
					useSeparator = false;
					datasetSize = datasetSize - 1;
				}
				
				if (y < datasetSize && useSeparator) {
					queryString += separator;
					y++;
				}
			}
		}
		if (getObjectSize(dataSet) > 0) {
			queryString = ' ' + clause + ' ' + queryString;
		}
		return queryString;
	};
	
	var buildJoinString = function() {
		var joinString = '';
		
		for (var i = 0; i < joinClause.length; i++) {
			joinString += (joinClause[i].direction !== '' ? ' ' + joinClause[i].direction : '') + ' JOIN ' + protectIdentifiers(joinClause[i].table) + ' ON ' + joinClause[i].relation;
		}
		
		return joinString;
	};
	
	var mergeObjects = function() {
		for (var i = 1; i < arguments.length; i++) {
			for (var key in arguments[i]) {
				if (arguments[i].hasOwnProperty(key)) {
					arguments[0][key] = arguments[i][key];
				}
			}
		}
		return arguments[0];
	};
	
	var getObjectSize = function(object) {
		var size = 0;
		for (var key in object) {
			if (object.hasOwnProperty(key)) {
				size++;
			}
		}
		return size;
	};
	
	var trim = function (s) {
		var l = 0, r = s.length - 1;
		while (l < s.length && s[l] == ' ') {
			l++;
		}
		while (r > l && s[r] == ' ') {
			r-=1;
		}
		return s.substring(l, r + 1);
	};
	
	var hasOperator = function (str) {
		if(typeof str === 'string')
			if(str.trim().match(/(<|>|!|=|\sIS NULL|\sIS NOT NULL|\sEXISTS|\sBETWEEN|\sLIKE|\sIN\s*\(|\s)/gi));
	}
	
	this.connectionSettings = function() { return connectionSettings; };
	this.connection = function() { return connection; };

	this.where = function(key, value, isRaw) {
		isRaw = isRaw || false;
		value = value || null;
		
		var escape = (isRaw ? false : true);
		return this._where(key, value, 'AND ', escape);
	};
	
	this.or_where = function(key, value, isRaw) {
		isRaw = isRaw || false;
		value = value || null;
		
		var escape = (isRaw ? false : true);
		return this._where(key, value, 'OR ', escape);
	};
	
	this._where = function(key, value, type, escape) {
		value = value || null;
		type = type || 'AND ';
		
		if (Object.prototype.toString.call(key) !== Object.prototype.toString.call({})) {
			key_array = {};
			key_array[key] = value;
			key = key_array;
		}
		
		for (var k in key) {
			var v = key[k];
			var prefix = (whereArray.length == 0 ? '' : type);
			
			if (v === null && !hasOperator(k)) {
				k += ' IS NULL';
			}
			
			if (v !== null) {
				if (escape === true) {
					k = protectIdentifiers(k);
					v = ' ' + this.escape(v);
				}
				
				if (!hasOperator(k)) {
					k += ' =';
				}
			}
			else {
				k = protectIdentifiers(k);
			}
			
			whereArray.push(prefix+k+v);
		}
		
		return that;
	}
	
	this.count = function(tableName, responseCallback) {
		if (typeof tableName === 'string') {
			var combinedQueryString = 'SELECT ' + distinctClause + 'COUNT(*) as count FROM ' + protectIdentifiers(tableName)
			+ buildJoinString()
			+ buildWhereClause();
			
			connection.query(combinedQueryString, function(err, res) { 
				if (err)
					responseCallback(err, null);
				else
					responseCallback(null, res[0]['count']);
			});
			resetQuery(combinedQueryString);
		}
		
		return that;
	};

	this.join = function(tableName, relation, direction) {
		joinClause.push({
			table: tableName,
			relation: relation,
			direction: (typeof direction === 'string' ? trim(direction.toUpperCase()) : '')
		});
		return that;
	};
	
	this.select = function(selectSet) {
		if (Object.prototype.toString.call(selectSet) === '[object Array]') {
			for (var i = 0; i < selectSet.length; i++) {
				selectClause.push(selectSet[i]);
			}
		}
		else {
			if (typeof selectSet === 'string') {
				var selectSetItems = selectSet.split(',');
				for (var i = 0; i < selectSetItems.length; i++) {
					selectClause.push(trim(selectSetItems[i]));
				}
			}
		}
		return that;
	};
	
	this.distinct = function() {
		distinctClause = 'DISTINCT ';
		return that;
	};

	this.comma_separated_arguments = function(set) {
		var clause = '';
		if (Object.prototype.toString.call(set) === '[object Array]') {
			clause = set.join(', ');
		}
		else if (typeof set === 'string') {
			clause = set;
		}
		return clause;
	};

	this.group_by = function(set) {
		groupByClause = this.comma_separated_arguments(set);
		return that;
	};

	this.having = function(set) {
		havingClause = this.comma_separated_arguments(set);
		return that;
	};

	this.order_by = function(set) {
		orderByClause = this.comma_separated_arguments(set);
		return that;
	};
	
	this.limit = function(newLimit, newOffset) {
		if (typeof newLimit === 'number') {
			limitClause = newLimit;
		}
		if (typeof newOffset === 'number') {
			offsetClause = newOffset;
		}
		return that;
	};

	this.ping = function() {
		connection.ping();
		return that;
	};
	
	this.insert = function(tableName, dataSet, responseCallback, verb, querySuffix) {
		if (typeof verb === 'undefined') {
			var verb = 'INSERT';
		}
		if (Object.prototype.toString.call(dataSet) !== '[object Array]') {
			if (typeof querySuffix === 'undefined') {
				var querySuffix = '';
			}
			else if (typeof querySuffix !== 'string') {
				var querySuffix = '';
			}
			if (typeof tableName === 'string') {
				
				var combinedQueryString = verb + ' into ' + protectIdentifiers(tableName)
				+ buildDataString(dataSet, ', ', 'SET');
				
				if (querySuffix != '') {
					combinedQueryString = combinedQueryString + ' ' + querySuffix;
				}
				
				connection.query(combinedQueryString, responseCallback);
				resetQuery(combinedQueryString);
			}
		}
		else {
			doBatchInsert(verb, tableName, dataSet, responseCallback);
		}
		return that;
	};
	
	this.insert_ignore = function(tableName, dataSet, responseCallback, querySuffix) {
		return this.insert(tableName, dataSet, responseCallback, 'INSERT IGNORE', querySuffix);
	};

	var doBatchInsert = function(verb, tableName, dataSet, responseCallback) {
		if (Object.prototype.toString.call(dataSet) !== '[object Array]') {
			throw new Error('Array of objects must be provided for batch insert!');
		}
		
		if (dataSet.length == 0) return false;

		var map = [];
		var columns = [];

		for (var key in dataSet[0]) {
			if (dataSet[0].hasOwnProperty(key)) {
				if (columns.indexOf(key) == -1) {
					columns.push(protectIdentifiers(key));
				}
			}
		}

		for (var i = 0; i < dataSet.length; i++) {
			(function(i) {
				var row = [];
				for (var key in dataSet[i]) {
					if (dataSet[i].hasOwnProperty(key)) {
						row.push(that.escape(dataSet[i][key]));
					}
				}
				if (row.length != columns.length) {
					throw new Error('Cannot use batch insert into ' + tableName + ' - fields must match on all rows (' + row.join(',') + ' vs ' + columns.join(',') + ').');
				}
				map.push('(' + row.join(',') + ')');
			})(i);
		}

		that.query(verb + ' INTO ' + protectIdentifiers(tableName) + ' (' + columns.join(', ') + ') VALUES' + map.join(','), responseCallback);
		return that;
	};

	this.get = function(tableName, responseCallback) {
		if (typeof tableName === 'string') {
			var combinedQueryString = 'SELECT ' + distinctClause + (selectClause.length === 0 ? '*' : selectClause.join(','))
			+ ' FROM ' + protectIdentifiers(tableName)
			+ buildJoinString()
			+ buildWhereClause()
			+ (groupByClause !== '' ? ' GROUP BY ' + groupByClause : '')
			+ (havingClause !== '' ? ' HAVING ' + havingClause : '')
			+ (orderByClause !== '' ? ' ORDER BY ' + orderByClause : '')
			+ (limitClause !== -1 ? ' LIMIT ' + limitClause : '')
			+ (offsetClause !== -1 ? ' OFFSET ' + offsetClause : '');
			
			connection.query(combinedQueryString, responseCallback);
			resetQuery(combinedQueryString);
		}
		
		return that;
	};
	
	this.update = function(tableName, newData, responseCallback) {
		if (typeof tableName === 'string') {
			var combinedQueryString = 'UPDATE ' + protectIdentifiers(tableName)
			+ buildDataString(newData, ', ', 'SET')
			+ buildWhereClause()
			+ (limitClause !== -1 ? ' LIMIT ' + limitClause : '');
						
			connection.query(combinedQueryString, responseCallback);
			resetQuery(combinedQueryString);
		}
		
		return that;
	};
	
	this.escape = function(str) {
		return connection.escape(str);
	};
	
	this.delete = function(tableName, responseCallback) {
		if (typeof tableName === 'string') {
			var combinedQueryString = 'DELETE FROM ' + protectIdentifiers(tableName)
			+ buildWhereClause()
			+ (limitClause !== -1 ? ' LIMIT ' + limitClause : '');
						
			connection.query(combinedQueryString, responseCallback);
			resetQuery(combinedQueryString);
		}
		
		return that;
	};
	
	this._last_query = function() {
		return lastQuery;
	};
	
	this.query = function(sqlQueryString, responseCallback) {
		connection.query(sqlQueryString, responseCallback);
		resetQuery(sqlQueryString);
		return that;
	};
	
	this.disconnect = function() {
		return connection.end();
	};

	this.forceDisconnect = function() {
		return connection.destroy();
	};
	
	this.releaseConnection = function() {
		pool.releaseConnection(connection);
	};

	this.releaseConnection = function() {
		pool.releaseConnection(connection);
	};

	var reconnectingTimeout = false;

	function handleDisconnect(connectionInstance) {
		connectionInstance.on('error', function(err) {
			if (!err.fatal || reconnectingTimeout) {
				return;
			}

			if (err.code !== 'PROTOCOL_CONNECTION_LOST' && err.code !== 'ECONNREFUSED') {
				throw err;
			}

			var reconnectingTimeout = setTimeout(function() {
				connection = mysql.createConnection(connectionInstance.config);
				handleDisconnect(connection);
				connection.connect();
			}, 2000);
		});
	}

	if (!pool) {
		handleDisconnect(connection);
	}

	var that = this;
	
	return this;
};

var mysqlPool; // this should be initialized only once.
var mysqlCharset;

var Pool = function (settings) {
	if (!mysqlPool) {
		var mysql = require('mysql');

		var poolOption = {
			createConnection: settings.createConnection,
			waitForConnections: settings.waitForConnections,
			connectionLimit: settings.connectionLimit,
			queueLimit: settings.queueLimit
		};
		Object.keys(poolOption).forEach(function (element) {
			// Avoid pool option being used by mysql connection.
			delete settings[element];
			// Also remove undefined elements from poolOption
			if (!poolOption[element]) {
				delete poolOption[element];
			}
		});

		// Confirm settings with Adapter.
		var db = new Adapter(settings);
		var connectionSettings = db.connectionSettings();

		Object.keys(connectionSettings).forEach(function (element) {
			poolOption[element] = connectionSettings[element];
		});

		mysqlPool = mysql.createPool(poolOption);
		mysqlCharset = settings.charset;
	}

	this.pool = function () {
		return mysqlPool;
	};

	this.getNewAdapter = function (responseCallback) {
		mysqlPool.getConnection(function (err, connection) {
			if (err) {
				throw err;
			}
			var adapter = new Adapter({
				pool: {
					pool: mysqlPool,
					enabled: true,
					connection: connection
				},
				charset: mysqlCharset
			});
			responseCallback(adapter);
		});
	};

	this.disconnect = function (responseCallback) {
		this.pool().end(responseCallback);
        };

	return this;
};

exports.Adapter = Adapter;
exports.Pool = Pool;