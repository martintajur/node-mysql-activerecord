/**
 * MySQL ActiveRecord Adapter for Node.js
 * (C) Martin Tajur 2011
 * martin@tajur.ee
 * 
 * Active Record Database Pattern implementation for use with node-mysql as MySQL connection driver.
 * 
 * Requires: node-mysql
 * 
 * 
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
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

exports.Adapter = function(settings) {
	
	if (!settings.server) {
		throw new Error('Unable to start ActiveRecord - no server given.');
	}
	if (!settings.port) {
		settings.port = 3306;
	}
	if (!settings.username) {
		settings.username = '';
	}
	if (!settings.password) {
		settings.password = '';
	}
	if (!settings.database) {
		throw new Error('Unable to start ActiveRecord - no username given.');
	}
	
	var connection = new require('mysql').createClient({
		host: settings.server,
		port: settings.port,
		user: settings.username,
		password: settings.password,
		database: settings.database
	});
	
	if (settings.charset) {
		connection.query('SET NAMES ' + settings.charset);
	}

	var whereClause = {},
		selectClause = [],
		orderByClause = '',
		limitClause = -1,
		offsetClause = -1,
		joinClause = [],
		lastQuery = '';
	
	var resetQuery = function(newLastQuery) {
		whereClause = {};
		selectClause = [];
		orderByClause = '';
		limitClause = -1;
		offsetClause = -1;
		joinClause = [];
		lastQuery = (typeof newLastQuery === 'string' ? newLastQuery : '');
		rawWhereClause = {};
	};
	
	var rawWhereClause = {};
	
	var escapeFieldName = function(str) {
		return (!rawWhereClause[str] ? '`' + str.replace('.','`.`') + '`' : str);
	};
	
	var buildDataString = function(dataSet, separator, clause) {
		if (!clause) {
			clause = 'WHERE';
		}
		var queryString = '', y = 1;
		if (!separator) {
			separator = ', ';
		}
		
		for (var key in dataSet) {
			if (dataSet.hasOwnProperty(key)) {
				if (typeof dataSet[key] !== 'object') {
					queryString += escapeFieldName(key) + "=" + connection.escape(dataSet[key]);
				}
				else if (typeof dataSet[key] === 'object' && dataSet[key] instanceof Array && dataSet[key].length > 0) {
					queryString += escapeFieldName(key) + ' in ("' + dataSet[key].join('", "') + '")';
				}
				if (y < getObjectSize(dataSet)) {
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
			joinString += (joinClause[i].direction !== '' ? ' ' + joinClause[i].direction : '') + ' JOIN ' + escapeFieldName(joinClause[i].table) + ' ON ' + joinClause[i].relation;
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
	
	this.where = function(whereSet, whereValue, isRaw) {
		if (typeof whereSet === 'object' && typeof whereValue === 'undefined') {
			whereClause = mergeObjects(whereClause, whereSet);
		}
		else if ((typeof whereSet === 'string' || typeof whereSet === 'number') && typeof whereValue != 'undefined') {
			if (isRaw) {
				rawWhereClause[whereSet] = true;
			}
			whereClause[whereSet] = whereValue;
		}
		else if ((typeof whereSet === 'string' || typeof whereSet === 'number') && typeof whereValue === 'object' && whereValue instanceof Array) {
			whereClause[whereSet] = whereValue;
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
		if (selectSet instanceof Array) {
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
	
	this.order_by = function(orderSet) {
		if (orderSet instanceof Array) {
			orderByClause = '';
			for (var i = 0; i < orderSet.length; i++) {
				orderByClause += orderSet[i];
				if (i + 1 !== orderSet.length) {
					orderByClause += ', ';
				}
			}
		}
		else if (typeof orderSet === 'string') {
			orderByClause = orderSet;
		}
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
	
	this.insert = function(tableName, dataSet, responseCallback) {
		if (typeof tableName === 'string') {
			
			var combinedQueryString = 'INSERT into ' + escapeFieldName(tableName)
			+ buildDataString(dataSet, ', ', 'SET');
			
			connection.query(combinedQueryString, responseCallback);
			resetQuery(combinedQueryString);
		}
		return that;
	};
	
	this.get = function(tableName, responseCallback) {
		if (typeof tableName === 'string') {
			var combinedQueryString = 'SELECT ' + (selectClause.length === 0 ? '*' : selectClause.join(','))
			+ ' FROM ' + escapeFieldName(tableName)
			+ buildJoinString()
			+ buildDataString(whereClause, ' AND ', 'WHERE')
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
			var combinedQueryString = 'UPDATE ' + escapeFieldName(tableName)
			+ buildDataString(newData, ', ', 'SET')
			+ buildDataString(whereClause, ' AND ', 'WHERE')
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
			var combinedQueryString = 'DELETE FROM ' + escapeFieldName(tableName)
			+ buildDataString(whereClause, ' AND ', 'WHERE')
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

	var that = this;
	
	return this;
}