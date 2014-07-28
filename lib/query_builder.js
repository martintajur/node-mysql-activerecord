var QueryBuilder = function() {
	
	// ------------------------------ GENERIC FUNCTIONS ------------------------------//
	var array_values = function(item) {
		var keys = Object.keys(item);
		var length = keys.length;
		var values = Array(length);
		for (var i = 0; i < length; i++) {
		  values[i] = item[keys[i]];
		}
		return values;
	}

	// ---------------------------------------- SQL ESCAPE FUNCTIONS ------------------------ //
	var trackAliases = function(qb,table) {
		if (Object.prototype.toString.call(table) === Object.prototype.toString.call({})) {
			for (var i in table) {
				var t = table[i];
				trackAliases(qb,t);
			}
			return;
		}

		// Does the string contain a comma?  If so, we need to separate
		// the string into discreet statements
		if (table.indexOf(',') !== -1) {
			return trackAliases(qb,table.split(','));
		}

		// if a table alias is used we can recognize it by a space
		if (table.indexOf(' ') !== -1) {
			// if the alias is written with the AS keyword, remove it
			table = table.replace(/\s+AS\s+/gi, ' ');
			
			// Grab the alias
			alias = table.slice(table.lastIndexOf(' ')).trim().replace(/`/g,'');

			// Store the alias, if it doesn't already exist
			if(qb.aliasedTables.indexOf(alias) == -1) {
				qb.aliasedTables.push(alias);
			}
		}
	}

	var createAliasFromTable = function(item) {
		if (item.indexOf('.') !== -1) {
			return item.split('.').reverse()[0];
		}

		return item;
	};

	var escapeIdentifiers = function(item) {
		if (!item || item === '*') {
			return item;
		}
		
		if (Object.prototype.toString.call(item) === Object.prototype.toString.call({})) {
			for (var i in item) {
				item[i] = escapeIdentifiers(item[i]);
			}
			return item;
		}
		else if ((typeof item === 'string' && item.match(/^\d+$/)) || item[0] === "'" || item[0] === '"' || item.indexOf('(') !== -1) {
			return item;
		}
		
		var str;
		if (item.indexOf('.' + '*') !== -1) {
			str = item.replace(/`?([^`\.]+)`?\./ig, "`$1`.");
		}
		else {
			str = item.replace(/`?([^`\.]+)`?(\.)?/ig, "`$1`$2`");
		}
		
		// remove duplicates if the user already included the escape
		return str.replace(/[`]+/g,'`');
	}

	var protectIdentifiers = function(qb,item,protect_identifiers) {
		protect_identifiers = (typeof protect_identifiers === 'boolean' ? protect_identifiers : true);
		
		if(Object.prototype.toString.call(item) === Object.prototype.toString.call({})) {
			var escaped_array = {};

			for (k in item) {
				var v = item[k];
				escaped_array[protectIdentifiers(qb,k)] = protectIdentifiers(qb,v);
			}

			return escaped_array;
		}
		
		// Convert tabs or multiple spaces into single spaces
		item = item.replace(/\s+/g, ' ');
		
		// If the item has an alias declaration we remove it and set it aside.
		// Basically we remove everything to the right of the first space
		if (item.match(/\sAS\s/ig)) {
			var alias_index = item.indexOf(item.match(/\sAS\s/ig)[0]);
			var alias = (protect_identifiers ? item.substr(alias_index,4) + escapeIdentifiers(item.slice(alias_index + 4)) : item.substr(alias_index));
			item = item.substr(0,alias_index);
		}
		else if (item.indexOf(' ') !== -1) {
			var alias_index = item.indexOf(' ');
			
			var alias = (protect_identifiers && ! hasOperator(item.substr(alias_index + 1)) ? ' ' + escapeIdentifiers(item.substr(alias_index + 1)) : item.substr(alias_index));
			item = item.substr(0,alias_index);
		}
		else {
			alias = '';
		}
		
		// This is basically a bug fix for queries that use MAX, MIN, etc.
		// If a parenthesis is found we know that we do not need to
		// escape the data or add a prefix.
		if (item.indexOf('(') !== -1 || item.indexOf("'") !== -1) {
			return item;
		}
		
		// Break the string apart if it contains periods, then insert the table prefix
		// in the correct location, assuming the period doesn't indicate that we're dealing
		// with an alias. While we're at it, we will escape the components
		if (item.indexOf('.') !== -1) {
			parts	= item.split('.');
			var first_seg = parts[0].trim().replace(/`/g,'');
			
			// Does the first segment of the exploded item match
			// one of the aliases previously identified?  If so,
			// we have nothing more to do other than escape the item
			if (qb.aliasedTables.indexOf(first_seg) !== -1) {
				if (protect_identifiers === true) {
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

			if (protect_identifiers === true) {
				item = escapeIdentifiers(item);
			}

			return item + alias;
		}
		if (protect_identifiers === true) {
			item = escapeIdentifiers(item);
		}
		
		return item + alias;
	};

	var hasOperator = function (str) {
		if(typeof str === 'string' && str.length > 0) {
			var match = str.trim().match(/(<|>|!|=|\sIS NULL|\sIS NOT NULL|\sEXISTS|\sBETWEEN|\sLIKE|\sIN\s*\(|\s)/i);
			if(match === null) {
				return false;
			}
		}
		return true;
	}

	var qb_escape = function(str) {
		if (typeof str === 'string') {
			str = "'" + this.escape(str) + "'";
		}
		else if (typeof str === 'boolean') {
			str = (str === false ? 0 : 1);
		}
		else if (str === null) {
			str = 'NULL';
		}

		return str;
	}


	// ---------------------------- SQL BUILD TOOLS ----------------------------//
	var buildWhereClause = function(qb) {
		var sql = '';
		if(qb.whereArray.length > 0) {
			sql += " WHERE ";
		}
		sql += qb.whereArray.join(" ");
		return sql;
	}

	var buildFromClause = function(qb) {
		var sql = '';
		if(qb.fromArray.length > 0) {
			sql += " FROM ";
		} else {
			throw new Error("You have not provided any tables, views, or store procedures for this query!!");
		}
		sql += '(' + qb.fromArray.join(', ') + ')';
		return sql;
	};

	var buildJoinString = function(qb) {
		var sql = '';
		sql += qb.joinArray.join(' ');
		if(sql.length > 0) sql = ' ' + sql;
		return sql;
	};

	var buildGroupByClause = function(qb) {
		if (qb.groupByArray.length <= 0) return '';
		
		var sql = ' GROUP BY ';
		sql += qb.groupByArray.join(', ');
		return sql;
	}

	var buildHavingClause = function(qb) {
		if (qb.havingArray.length <= 0) return '';
		
		var sql = ' HAVING ';
		sql += qb.havingArray.join(' ');
		return sql;
	}

	var buildOrderByClause = function(qb) {
		if (qb.orderByArray.length <= 0) return '';
		
		var sql = ' ORDER BY ';
		sql += qb.orderByArray.join(', ');
		
		if (qb.orderByDir !== false) {
			sql += (qb.orderByDir == 'desc' ? ' DESC' : ' ASC');
		}
		
		return sql;
	}

	var buildLimitClause = function(sql, limit, offset) {
		if (!limit) return sql;
		
		var sql = ' ';
		
		if (offset == 0) {
			offset = '';
		}
		else {
			offset += ', ';
		}
		return sql.replace(/\s+$/, '') + 'LIMIT ' + offset + limit;
	}

	var compileSelect = function(qb) {
		var sql = 'SELECT ' + qb.distinctClause;
		if (qb.selectArray.length === 0) {
			sql += '*';
		} else {
			sql += qb.selectArray.join(', ');
		}
		
		sql += buildFromClause(qb)
			+ buildJoinString(qb)
			+ buildWhereClause(qb)
			+ buildGroupByClause(qb)
			+ buildHavingClause(qb)
			+ buildOrderByClause(qb);
		
		sql = buildLimitClause(sql,qb.limitTo,qb.offsetVal);
		return sql;
	}


	// ---------------------------- ACTUAL QUERY BUILDER ----------------------------//
	return {
		whereArray: [],
		whereInArray: [],
		fromArray: [],
		joinArray: [],
		selectArray: [],
		setArray: [],
		orderByArray: [],
		orderByDir: false,
		groupByArray: [],
		havingArray: [],
		limitTo: false,
		offsetVal: false,
		joinClause: [],
		lastQueryString: '',
		distinctClause: '',
		aliasedTables: [],
		
		resetQuery: function(newLastQuery) {
			this.whereArray = [];
			this.whereInArray = [];
			this.fromArray = [];
			this.joinArray = [];
			this.selectArray = [];
			this.setArray = [];
			this.orderByArray = [];
			this.orderByDir = false;
			this.groupByArray = [];
			this.havingArray = [];
			this.limitTo = false;
			this.offsetVal = false;
			this.joinClause = [];
			this.distinctClause = '';
			this.lastQueryString = (typeof newLastQuery === 'string' ? newLastQuery : '');
			this.aliasedTables = [];
		},
		
		where: function(key, value, isRaw) {
			isRaw = (typeof isRaw === 'boolean' ? isRaw : false);
			value = value || null;
			
			var escape = (isRaw ? false : true);
			if (typeof key === 'string' && typeof value === 'object' && Object.prototype.toString.call(value) === Object.prototype.toString.call([]) && value.length > 0) {
				return this._where_in(key, value, false, 'AND ');
			}
			return this._where(key, value, 'AND ', escape);
		},
		
		or_where: function(key, value, isRaw) {
			isRaw = (typeof isRaw === 'boolean' ? isRaw : false);
			value = value || null;
			
			var escape = (isRaw ? false : true);
			if (typeof key === 'string' && typeof value === 'object' && Object.prototype.toString.call(value) === Object.prototype.toString.call([]) && value.length > 0) {
				return this._where_in(key, value, false, 'OR ');
			}
			return this._where(key, value, 'OR ', escape);
		},
		
		where_in: function(key, values) {
			return this._where_in(key,values,false,'AND ');
		},
		
		or_where_in: function(key, values) {
			return this._where_in(key,values,false,'OR ');
		},
		
		where_not_in: function(key, values) {
			return this._where_in(key,values,true,'AND ');
		},
		
		or_where_not_in: function(key, values) {
			return this._where_in(key,values,true,'OR ');
		},
		
		_where: function(key, value, type, escape) {
			value = value || null;
			type = type || 'AND ';
			escape = (typeof escape === 'boolean' ? escape : true);
			
			if (Object.prototype.toString.call(key) !== Object.prototype.toString.call({})) {
				key_array = {};
				key_array[key] = value;
				key = key_array;
			}
			
			for (var k in key) {
				var v = key[k];
				
				if (typeof v === 'object' && Object.prototype.toString.call(v) === Object.prototype.toString.call([]) && v.length > 0) {
					return this._where_in(k,v,false,type);
				}
				
				var prefix = (this.whereArray.length == 0 ? '' : type);
				
				if (v === null && !hasOperator(k)) {
					k += ' IS NULL';
				}
				
				if (v !== null) {
					if (escape === true) {
						k = protectIdentifiers(this,k);
						v = ' ' + qb_escape(v);
					}
					
					if (!hasOperator(k)) {
						k += ' =';
					}
				}
				else {
					k = protectIdentifiers(this,k);
				}
				
				if (v) {
					this.whereArray.push(prefix+k+v);
				} 
				else {
					this.whereArray.push(prefix+k);
				}
			}
			
			return this;
		},
		
		_where_in: function(key, values, not, type) {
			key = key || null;
			values = values || [];
			type = type || 'AND ';
			not = (not ? ' NOT' : '');
			
			if(key === null || values.length === 0) return this;
			
			// Values must be an array...
			if(Object.prototype.toString.call(values) !== Object.prototype.toString.call([])) {
				values = [values];
			}
			
			for (var i in values) {
				this.whereInArray.push(qb_escape(values[i]));
			}

			prefix = (this.whereArray.length == 0 ? '' : type);
			where_in = prefix + protectIdentifiers(this,key) + not + " IN (" + this.whereInArray.join(', ') + ") ";
			this.whereArray.push(where_in);

			// reset the array for multiple calls
			this.whereInArray = [];
			return this;
		},
		
		like: function(field, match, side) {
			match = match || '';
			side = side || 'both';
			
			return this._like(field, match, 'AND ', side, '');
		},
		
		not_like: function(field, match, side) {
			match = match || '';
			side = side || 'both';
			
			return this._like(field, match, 'AND ', side, ' NOT');
		},
		
		or_like: function(field, match, side) {
			match = match || '';
			side = side || 'both';
			
			return this._like(field, match, 'OR ', side, '');
		},
		
		or_not_like: function(field, match, side) {
			match = match || '';
			side = side || 'both';
			
			return this._like(field, match, 'OR ', side, ' NOT');
		},
		
		_like: function(field, match, type, side, not) {
			match = match || '';
			type = type || 'AND ';
			side = side || 'both';
			not = not || '';
		
			if(Object.prototype.toString.call(field) !== Object.prototype.toString.call({})) {
				field_array = {};
				field_array[field] = match;
				field = field_array;
			}

			for(k in field) {
				v = field[k];
				k = protectIdentifiers(this,k.trim());

				if (side === 'none') {
					like_statement =  k + not + ' LIKE ' + "'" + v + "'";
				} 
				else if (side === 'before') {
					like_statement = k + not + ' LIKE ' + "'%" + v + "'";
				} 
				else if (side === 'after') {
					like_statement = k + not + ' LIKE ' + "'" + v + "%'";
				} 
				else {
					like_statement = k + not + ' LIKE ' + "'%" + v + "%'";
				}
				
				this._where(like_statement,null,type,false);
			}

			return this;
		},
		
		count: function(table, responseCallback) {
			if (typeof table === 'string') {
				trackAliases(this,table);
				this.from(table);
			}
			var sql = 'SELECT COUNT(*) AS ' + protectIdentifiers(this,'count')
				+ buildFromClause(this)
				+ buildJoinString(this)
				+ buildWhereClause(this)
			
			return sql;
		},
		
		from: function(from) {
			if(Object.prototype.toString.call(from) !== Object.prototype.toString.call([])) {
				from = [from];
			}
			for (var i in from) {
				var val = from[i];
				
				if (val.indexOf(',') !== -1) {
					var objects = val.split(',');
					for (var j in objects) {
						var v = objects[j].trim();
						
						trackAliases(this,v);

						this.fromArray.push(protectIdentifiers(this,v,true));
					}
				}
				else {
					val = val.trim();

					// Extract any aliases that might exist.  We use this information
					// in the protectIdentifiers function to know whether to add a table prefix
					trackAliases(this,val);

					this.fromArray.push(protectIdentifiers(this,val,true));
				}
			}

			return this;
		},

		join: function(table, relation, direction, escape) {
			if (typeof table !== 'string' || table.trim().length == 0) {
				throw new Error("You must provide a table, view, or stored procedure to join to!");
			}
		
			relation = (typeof relation === 'string' && relation.trim().length != 0 ? relation.trim() : '');
			direction = (typeof direction === 'string' && direction.trim().length != 0 ? direction.trim() : '');
			escape = (typeof escape === 'boolean' ? escape : true);
			
			var valid_directions = ['LEFT','RIGHT','OUTER','INNER','LEFT OUTER','RIGHT OUTER'];
			
			if (direction != '') {
				direction = direction.toUpperCase().trim();
				if (valid_directions.indexOf(direction) === -1) {
					throw new Error("Invalid join direction provided as third parameter.");
				}
				if (relation === '') {
					throw new Error("You must provide a valid condition to join on when providing a join direction.");
				}
				
				direction += ' ';
			}
			
			trackAliases(this,table);
			
			// Split multiple conditions
			var regex = /\sAND\s|\sOR\s/ig;
			var m = relation.match(regex);
			var matches = [];
			var k, temp, temp_match;
			if (escape === true && m) {
				while(k = regex.exec(relation)) {
					matches.push(k);
				}
				
				var new_relation = '';
				matches.push(['']);
				matches[(matches.length - 1)].index = relation.length;
				for (var j = 0, c = matches.length, s = 0; j < c; s = matches[j].index + matches[j][0].length, j++) {
					temp = relation.substr(s, matches[j].index - s);
					temp_match = temp.match(/([\[\]\w\.'-]+)(\s*[^\"\[`'\w]+\s*)(.+)/i);
					new_relation += (temp_match ? protectIdentifiers(this,temp_match[1],escape) + temp_match[2] + protectIdentifiers(this,temp_match[3],escape) : temp);
					new_relation += matches[j][0];
				}
				
				relation = ' ON ' + new_relation;
			}
			
			// Split apart the condition and protect the identifiers
			else if (escape === true && relation.match(/([\[\]\w\.'-]+)(\s*[^\"\[`'\w]+\s*)(.+)/i)) {
				match = relation.match(/([\[\]\w\.'-]+)(\s*[^\"\[`'\w]+\s*)(.+)/i)
				relation = ' ON ' + protectIdentifiers(this,match[1],true) + match[2] + protectIdentifiers(this,match[3],true);
			}
			else if (!hasOperator(relation)) {
				console.log("Has operator: " + relation);
				relation = ' USING (' + (escape ? escapeIdentifiers(relation) : relation) + ')';
			}
			else {
				relation = ' ';
			}
			
			// Do we want to escape the table name?
			if (escape === true) {
				table = protectIdentifiers(this,table,true);
			}
			
			join = direction + 'JOIN ' + table + relation;
			
			this.joinArray.push(join);
			return this;
		},
		
		select: function(select,escape) {
			if (typeof select === 'string') {
				select = select.trim();
				if (select.length == 0) {
					throw new Error("Your select string is empty!");
				}
			}
			else if (Object.prototype.toString.call(select) === Object.prototype.toString.call([])) {
				if (select.length == 0) {
					throw new Error("Your select array is empty!");
				}
			}
			else {
				throw new Error("Select method requires a string or array to be passed in the first parameter!");
			}
			
			if (typeof escape !== 'boolean') escape = true;
			
			if (typeof select === 'string') {
				select = select.split(',');
			}
			
			for (var i in select) {
				var val = select[i].trim();
				
				if(val !== '') {
					this.selectArray.push(protectIdentifiers(this,val,escape));
				}
			}
			return this;
		},
		
		select_min: function(select,alias) {
			return this._min_max_avg_sum(select,alias,'MIN');
		},
		
		select_max: function(select,alias) {
			return this._min_max_avg_sum(select,alias,'MAX');
		},
		
		select_avg: function(select,alias) {
			return this._min_max_avg_sum(select,alias,'AVG');
		},
		
		select_sum: function(select,alias) {
			return this._min_max_avg_sum(select,alias,'SUM');
		},
		
		_min_max_avg_sum: function(select,alias,type) {
			select = select || '';
			alias = alias || '';
			type = type || 'MAX';
			
			if (typeof select !== 'string' || select === '') {
				throw Error("Invalid query!");
				return this;
			}
			
			type = type.toUpperCase();
			
			if (['MAX','MIN','AVG','SUM'].indexOf(type) === -1) {
				throw Error("Invalid function type!");
				return this;
			}
			
			if (alias == '') {
				alias = createAliasFromTable(select.trim());
			}
			
			sql = type + '(' + protectIdentifiers(this,select.trim()) + ') AS ' + alias;
			
			this.selectArray.push(sql);
			
			return this;
		},
		
		distinct: function() {
			this.distinctClause = 'DISTINCT ';
			return this;
		},

		group_by: function(by) {
			if (typeof by === 'string') {
				by = by.split(',');
			}

			for (key in by) {
				val = by[key].trim();

				if (val !== '') {
					this.groupByArray.push(protectIdentifiers(this,val));
				}
			}
			return this;
		},

		having: function(key, value, escape) {
			return this._having(key, value, 'AND ', escape);
		},
		
		or_having: function(key,value,escape) {
			return this._having(key, value, 'OR ', escape);
		},
		
		_having: function(key, value, type, escape) {
			if (Object.prototype.toString.call(from) !== Object.prototype.toString.call({})) {
				key_array = {};
				key_array[key] = value;
				key = key_array;
			}
			
			for (var k in key) {
				var v = key[k];
				prefix = (this.havingArray.length == 0 ? '' : type);
				
				if (escape === true) {
					k = protectIdentifiers(this,k);
				}
				
				if (!hasOperator(k)) {
					k += ' = ';
				}
				
				if (v != '') {
					v = ' ' + qb_escape(v);
				}
				
				this.havingArray.push(prefix + k + k);
			}
			
			return this;
		},

		order_by: function(orderby, direction) {
			direction = direction || '';
			var rand_word = ' RAND()';
			
			if (direction.toLowerCase() == 'random') {
				orderby = ''; // Random results want or don't need a field name
				direction = rand_word;
			}
			else if (direction.trim() != '') {
				direction = (direction.trim().match(/^(ASC|DESC)$/i) ? ' ' + direction.toUpperCase() : ' ASC');
			}


			if (orderby.indexOf(',') !== -1) {
				temp = [];
				var parts = orderby.split(',');
				for (var i in parts) {
					var part = parts[i].trim();
					
					if (this.aliasedTables.indexOf(part) === -1) {
						part = protectIdentifiers(this,part.trim());
					}

					temp.push(part);
				}

				orderby = temp.join(', ');
			}
			else if (direction != rand_word) {
				if (!orderby.match(/\s+(ASC|DESC)\s*/i)) {
					orderby = protectIdentifiers(this,orderby);
				} else {
					var parts = orderby.match(/(.+)\s(ASC|DESC)/i);
					if (parts.length === 3) {
						orderby = protectIdentifiers(this,parts[1]) + ' ' + parts[2].toUpperCase();
					}
				}
			}
			
			orderby_statement = orderby + direction;
			this.qb.orderByArray.push(orderby_statement);
			
			return this;
		},
		
		limit: function(limit, offset) {
			if (!(typeof limit).match(/^(string|number)$/) || !limit.match(/^\d+$/)) {
				return this;
			}
			
			if (!(typeof offset).match(/^(string|number)$/) || !offset.match(/^\d+$/)) {
				offset = 0;
			}
			
			this.limitTo = parseInt(limit);
			this.offsetVal = parseInt(offset);
			
			return this;
		},
		
		offset: function(offset) {
			if ((typeof offset).match(/^(string|number)$/) && offset.match(/^\d+$/)) {
				this.offsetVal = offset;
			}
			return this;
		},
		
		set: function(key, value, escape) {
			escape = escape || true;
			value = value || '';
			
			if(Object.prototype.toString.call(value) !== Object.prototype.toString.call({})) {
				key_array = {};
				key_array[key] = value;
				key = key_array;
			}
			
			for (var i in key) {
				var v = key[i];
				
				if (escape === false) {
					this.setArray[protectIdentifiers(this,k)] = v;
				} else {
					this.setArray[protectIdentifiers(this,k,false)] = this.escape(v);
				}
			}
			
			return this;
		},
		
		insert: function(table, set, callback, ignore, suffix) {
			table = table || '';
			ignore = (typeof ignore !== 'boolean' ? false : ignore);
			suffix = (typeof suffix !== 'string' ? '' : suffix);
			
			if (Object.prototype.toString.call(set) === Object.prototype.toString.call([])) {
				return this.insert_batch(table, set, callback);
			}
			
			if (set !== null) {
				this.set(set);
			}
			
			if (table == '') {
				if (this.fromArray.length == 0) {
					throw new Error('No tables set to insert into!');
				}
				table = this.fromArray[0];
			} else {
				this.fromArray = [];
				this.from(table);
			}
			
			var keys = Object.keys(this.setArray);
			var values = array_values(this.setArray);
			var verb = 'INSERT ' + (ignore === true ? 'IGNORE ' : '');
			return verb + ' INTO ' + buildFromClause(this) + " (" + keys.join(', ') + ") VALUES (" + values.join(', ') + ")";
		},
		
		insert_ignore: function(table, set, callback, suffix) {
			return this.insert(table, set, callback, true, suffix);
		},
		
		insert_batch: function(table,set,callback) {
			table = table || '';
			set = set || null;
			
			if (table == '') {
				if (this.fromArray.length === 0) {
					throw new Error("You have not set any tables to insert into.");
				}

				table = this.fromArray[0];
			} else {
				this.fromArray = [];
				this.from(table);
			}
			
			if (Object.prototype.toString.call(set) !== Object.prototype.toString.call([])) {
				throw new Error('Array of objects must be provided for batch insert!');
			}
			
			if (set.length == 0) return false;
			
			var map = [];
			var columns = [];

			for (var key in set[0]) {
				if (set[0].hasOwnProperty(key)) {
					if (columns.indexOf(key) == -1) {
						columns.push(protectIdentifiers(this,key));
					}
				}
			}

			for (var i = 0; i < set.length; i++) {
				(function(i) {
					var row = [];
					for (var key in set[i]) {
						if (set[i].hasOwnProperty(key)) {
							row.push(this.escape(set[i][key]));
						}
					}
					if (row.length != columns.length) {
						throw new Error('Cannot use batch insert into ' + table + ' - fields must match on all rows (' + row.join(',') + ' vs ' + columns.join(',') + ').');
					}
					map.push('(' + row.join(',') + ')');
				})(i);
			}
			
			return 'INSERT INTO ' + buildFromClause(this) + ' (' + keys.join(', ') + ') VALUES' + values.join(',');
		},

		get: function(table, callback) {
			if (typeof table !== 'function') {
				trackAliases(this,table);
				this.from(table);
			}
			else {
				if (this.fromArray.length == 0) {
					throw new Error('You have not specified any tables to select from!');
				}
			}
			return compileSelect(this);
		},
		
		get_where: function(table, where) {
			where = where || null;
			
			if (typeof table !== 'string') {
				throw new Error('You must specify a table as the first parameter when using the get_where method!');
				return this;
			} else {
				trackAliases(this,table);
				this.from(table);
			}
			
			if (where !== null) {
				this.where(where);
			}
			
			return compileSelect(this);
		},
		
		update: function(table, set, where, callback) {
			set = set || null;
			
			// The where parameter is optional, it could be the callback...
			if (typeof where === 'function' && typeof callback !== 'function') {
				callback = where;
			}
			else if (typeof where === 'undefined' && typeof callback !== 'function') {
				throw new Error("No callback function has been provided in your update call!");
			}
			else if (typeof where === 'undefined' || where === false || (where !== null && typeof where === 'object' && where.length == 0)) {
				where = null;
			}
			
			if (set !== null) {
				this.set(set);
			}
			
			if (this.setArray.length == 0) {
				throw new Error("You must set a some field value pairs to update using the set method or in object for in the second parameter of the update method!");
			}
			
			if (table == '') {
				if (this.fromArray.length === 0) {
					throw new Error("You have not set any tables to update!");
				}

				table = this.fromArray[0];
			} else {
				this.fromArray = [];
				this.from(table);
				
				table = this.fromArray[0];
			}
			
			if (where != null) {
				this.where(where);
			}

			var sql = this._update(table, this.setArray, this.whereArray, this.orderByArray, this.limitTo);
			return sql;
		},
		
		_update: function(table,values,where,orderby,limit) {
			orderby = orderby || [];
			limit = limit || false;
			
			var valstr = [];
			for (var i in values) {
				valstr.push(key + ' = ' + values[i]);
			}
			
			limit = (!limit ? '' : ' LIMIT ' + limit);
			orderby = (orderby.length >= 1 ? ' ORDER BY ' + orderby.join(', ') : '');
			sql = 'UPDATE ' + table + " SET " + valstr.join(', ');
			sql += (where != '' && where.length >= 1 ? ' WHERE ' + where.join(' ') : '');
			sql += orderby + limit;
			return sql;
		},
		
		delete: function(table, callback) {
			if (typeof table !== 'function') {
				trackAliases(this,table);
				this.from(table);
			}
			else {
				if (fromArray.length == 0) {
					throw new Error('You have not specified any tables to delete from!');
					return this;
				}
			}
			
			var sql = 'DELETE' + buildFromClause(this) + buildWhereClause(this);
			return buildLimitClause(sql,limitTo,offsetVal);
		},
		
		_last_query: function() {
			return this.lastQueryString;
		}
	}
};

module.exports = QueryBuilder;