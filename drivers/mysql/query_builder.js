const QueryBuilder = function() {

    // ------------------------------ GENERIC FUNCTIONS ------------------------------//
    const array_values = item => {
        const keys = Object.keys(item);
        const length = keys.length;
        const values = Array(length);
        for (let i = 0; i < length; i++) {
          values[i] = item[keys[i]];
        }
        return values;
    };

    const prepare_for_limit_and_offset = (item, type = 'limit') => {

        type = type.toLowerCase();

        if (!/^(string|number)$/.test(typeof item)) {
            throw new Error("Only integers or integers in the form of a string are allowed");
        }

        if (typeof item === 'string') {
            item = item.trim();
            if (!/^\d+$/.test(item)) {
                throw new Error("The string you provided to " + type + " by contains non-integer values--this isn't allowed.");
            }
            // Force to an integer
            item = parseInt(item);
        }

        // Make sure the number is a good one
        if (typeof item === 'number') {
            // Check for NaN and Infinity
            if (item !== +item || item === Infinity) {
                throw new Error("You have not provided a valid number to " + type + " by!");
            }

            // Make sure it's positive
            if (item < 0) {
                throw new Error("Only positive integeres are allowed when " + (type == 'offset' ? 'OFFSET' : 'LIMIT') + "ing SQL results!");
            }

            // Only allow integers
            if (item % 1 !== 0) {
                throw new Error("You cannot " + type + " a SQL result set with a floating point value!");
            }
        }
        else {
            throw new Error("There was an unrecoverable error while parsing the value provdided in your " + type + " statement.");
        }

        return item;
    }

    const extract_having_parts = (key,key_array) => {
        let m;
        key = key.trim().replace(/\s+/g,' ');
        const str_condition  = /^([^\s]+\s(<=|>=|<>|>|<|!=|=))+\s"([^"]+)"$/;  //"// had to do this for syntax highlighting
        const sstr_condition = /^([^\s]+\s(<=|>=|<>|>|<|!=|=))+\s'([^']+)'$/;  //'// had to do this for syntax highlighting
        const num_condition  = /^([^\s]+\s(<=|>=|<>|>|<|!=|=))+\s((?=.)([+-]?([0-9]*)(\.([0-9]+))?))$/;
        const bool_condition = /^([^\s]+\s(<=|>=|<>|>|<|!=|=))+\s((true|false)+)$/;

        if (m = str_condition.exec(key)) {
            key_array[m[1]] = m[3];
            key = key_array;
        }
        else if (m = sstr_condition.exec(key)) {
            //console.log("Key has sstring value");
            key_array[m[1]] = m[3];
            key = key_array;
        }
        else if (m = num_condition.exec(key)) {
            //console.log("Key has numeric value");
            key_array[m[1]] = m[3];
            key = key_array;
        }
        else if (m = bool_condition.exec(key)) {
            //console.log("Key has boolean value");
            key_array[m[1]] = m[3];
            key = key_array;
        }
        else {
            throw new Error("An invalid condition was supplied (" + key + ") in your having statement!");
        }

        return key_array;
    }

    // Simply setting all properties to [] causes reference issues in the parent class.
    const clear_array = (a,debug) => {
        if (debug === true) {
            console.log("DEBUG before (" + Object.prototype.toString.call(a) + "):");
            console.dir(a);
        }
        if (Object.prototype.toString.call(a) === Object.prototype.toString.call({})) {
            for (let key in a) {
                if (a.hasOwnProperty(key)) {
                    delete a[key];
                }
            }
        }
        else if (Array.isArray(a)) {
            while (a.length > 0) {
                a.pop();
            }
        }
        if (debug === true) {
            console.log("DEBUG after (" + Object.prototype.toString.call(a) + "):");
            console.dir(a);
        }
    };

    // ---------------------------------------- SQL ESCAPE FUNCTIONS ------------------------ //
    const track_aliases = (qb,table) => {
        if (Object.prototype.toString.call(table) === Object.prototype.toString.call({})) {
            for (let i in table) {
                const t = table[i];
                track_aliases(qb,t);
            }
            return;
        }

        // Does the string contain a comma?  If so, we need to separate
        // the string into discreet statements
        if (table.indexOf(',') !== -1) {
            return track_aliases(qb,table.split(','));
        }

        // if a table alias is used we can recognize it by a space
        if (table.indexOf(' ') !== -1) {
            // if the alias is written with the AS keyword, remove it
            table = table.replace(/\s+AS\s+/gi, ' ');

            // Grab the alias
            const alias = table.slice(table.lastIndexOf(' ')).trim().replace(/`/g,'');

            // Store the alias, if it doesn't already exist
            if (qb.aliased_tables.indexOf(alias) == -1) {
                qb.aliased_tables.push(alias);
            }
        }
    };

    const create_aliases_from_table = item => {
        if (item.indexOf('.') !== -1) {
            return item.split('.').reverse()[0];
        }

        return item;
    };

    const escape_identifiers = (item = '*') => {
        if (item === '*') {
            return item;
        }

        if (Object.prototype.toString.call(item) === Object.prototype.toString.call({})) {
            for (let i in item) {
                item[i] = escape_identifiers(item[i]);
            }
            return item;
        }
        else if ((typeof item === 'string' && /^\d+$/.test(item)) || item[0] === "'" || item[0] === '"' || item.indexOf('(') !== -1) {
            return item;
        }

        let str;
        if (item.indexOf('.' + '*') !== -1) {
            str = item.replace(/`?([^`\.]+)`?\./ig, "`$1`.");
        }
        else {
            str = item.replace(/`?([^`\.]+)`?(\.)?/ig, "`$1`$2`");
        }

        // remove duplicates if the user already included the escape
        return str.replace(/[`]+/g,'`');
    };

    const protect_identifiers = (qb,item,protect_identifiers) => {
        if (item === '') return item;

        protect_identifiers = (typeof protect_identifiers === 'boolean' ? protect_identifiers : true);

        if (Object.prototype.toString.call(item) === Object.prototype.toString.call({})) {
            const escaped_array = {};

            for (k in item) {
                const v = item[k];
                escaped_array[protect_identifiers(qb,k)] = protect_identifiers(qb,v);
            }

            return escaped_array;
        }

        // Convert tabs or multiple spaces into single spaces
        item = item.replace(/\s+/g, ' ');

        // This is basically a bug fix for queries that use MAX, MIN, subqueries, etc.
        // If a parenthesis is found we know that we do not need to
        // escape the data or add a prefix.
        if (item.indexOf('(') !== -1 || item.indexOf("'") !== -1) {
            const has_alias = item.lastIndexOf(')');
            let alias;
            if (has_alias >= 0) {
                alias = item.substr(has_alias + 1).replace(/\sAS\s/i,'').trim();
                alias = escape_identifiers(alias);
                if (alias != '')
                    alias = ' AS ' + alias;
                item = item.substr(0,has_alias + 1);
            } else {
                alias = '';
            }

            return item + alias;
        }

        let alias = '';

        // If the item has an alias declaration we remove it and set it aside.
        // Basically we remove everything to the right of the first space
        if (/\sAS\s/ig.test(item)) {
            const alias_index = item.indexOf(item.match(/\sAS\s/ig)[0]);
            alias = (protect_identifiers ? item.substr(alias_index,4) + escape_identifiers(item.slice(alias_index + 4)) : item.substr(alias_index));
            item = item.substr(0,alias_index);
        }
        else if (item.indexOf(' ') !== -1) {
            const alias_index = item.indexOf(' ');

            alias = (protect_identifiers && ! has_operator(item.substr(alias_index + 1)) ? ' ' + escape_identifiers(item.substr(alias_index + 1)) : item.substr(alias_index));
            item = item.substr(0,alias_index);
        }

        // Break the string apart if it contains periods, then insert the table prefix
        // in the correct location, assuming the period doesn't indicate that we're dealing
        // with an alias. While we're at it, we will escape the components
        if (item.indexOf('.') !== -1) {
            const parts = item.split('.');
            const first_seg = parts[0].trim().replace(/`/g,'');

            // Does the first segment of the exploded item match
            // one of the aliases previously identified?  If so,
            // we have nothing more to do other than escape the item
            if (qb.aliased_tables.indexOf(first_seg) !== -1) {
                if (protect_identifiers === true) {
                    for (let key in parts) {
                        const val = parts[key];
                        if (val !== '*') {
                            parts[key] = escape_identifiers(val);
                        }
                    }

                    item = parts.join('.');
                }
                return item + alias;
            }

            if (protect_identifiers === true) {
                item = escape_identifiers(item);
            }

            return item + alias;
        }
        if (protect_identifiers === true) {
            item = escape_identifiers(item);
        }

        return item + alias;
    };

    const has_operator = function (str) {
        if (typeof str === 'string' && str.length > 0) {
            const match = /(<|>|!|=|\sIS NULL|\sIS NOT NULL|\sEXISTS|\sBETWEEN|\sLIKE|\sCASE|\sTHEN|\sWHEN|\sIN\s*\(|\s)/i.test(str.trim());
            if (!match) {
                return false;
            }
        }
        return true;
    };

    const qb_escape = (qb,str) => {
        const mysql = require('mysql');

        if (typeof str === 'boolean') {
            str = (str === false ? 0 : 1);
        } else if (typeof str === 'number' || (typeof str === 'string' && /^\d+$/.test(str) && !/^0+/.test(str))) {
            str *= 1;
        } else {
            str = mysql.escape(str);
        }

        return str;
    };


    // ---------------------------- SQL BUILD TOOLS ----------------------------//
    const build_where_clause = qb => {
        let sql = '';
        if (qb.where_array.length > 0) {
            sql += " WHERE ";
        }
        sql += qb.where_array.join(" ");
        return sql;
    };

    const build_from_clause = qb => {
        let sql = '';
        if (qb.from_array.length > 0) {
            sql += " FROM ";
        } else {
            throw new Error("You have not provided any tables, views, or store procedures for this query!!");
        }
        sql += qb.from_array.join(', ');
        return sql;
    };

    const build_join_string = qb => {
        let sql = '';
        sql += qb.join_array.join(' ');
        if (sql.length > 0) sql = ' ' + sql;
        return sql;
    };

    const build_group_by_clause = qb => {
        if (qb.group_by_array.length <= 0) return '';

        let sql = ' GROUP BY ';
        sql += qb.group_by_array.join(', ');
        return sql;
    };

    const build_having_clause = qb => {
        if (qb.having_array.length <= 0) return '';

        let sql = ' HAVING ';
        sql += qb.having_array.join(' ');
        return sql;
    };

    const build_order_by_clause = qb => {
        if (qb.order_by_array.length <= 0) return '';

        let sql = ' ORDER BY ';
        sql += qb.order_by_array.join(', ');

        return sql;
    };

    const build_limit_clause = (sql, limit, offset) => {
        if (!limit) return sql;

        sql += ' ';

        if (typeof offset !== 'number' || offset === 0) {
            offset = '';
        }
        else {
            offset += ', ';
        }
        return sql.replace(/\s+$/, ' ') + 'LIMIT ' + offset + limit;
    };

    const compile_select = qb => {
        const distinct_clause = qb.distinct_clause[0] || '';
        let sql = 'SELECT ' + distinct_clause;
        if (qb.select_array.length === 0) {
            sql += '*';
        } else {
            sql += qb.select_array.join(', ');
        }

        sql += build_from_clause(qb)
            + build_join_string(qb)
            + build_where_clause(qb)
            + build_group_by_clause(qb)
            + build_having_clause(qb)
            + build_order_by_clause(qb);

        const limit_to = qb.limit_to[0] || false;
        const offset_val = qb.offset_val[0] || false;

        sql = build_limit_clause(sql,limit_to,offset_val);
        return sql;
    };

    const compile_delete = qb => {
        if (qb.from_array.length === 0) {
            throw new Error('You have not specified any tables to delete from!');
            return '';
        }

        qb.from_array = qb.from_array.slice(0,1);

        const limit_to = qb.limit_to[0] || false;
        const offset_val = qb.offset_val[0] || false;

        const sql = 'DELETE' + build_from_clause(qb) + build_where_clause(qb);
        return build_limit_clause(sql,limit_to,offset_val);
    };

    const compile_update = qb => {
        const valstr = [];
        for (let i in qb.set_array) {
            const key = Object.keys(qb.set_array[i])[0];
            const val = qb.set_array[i][key];
            valstr.push(key + ' = ' + val);
        }

        if (qb.from_array.length !== 1) {
            if (qb.from_array.length === 0) {
                throw new Error("You haven't provided any tables to build UPDATE query with!");
                return '';
            }
            throw new Error("You have provided too many tables to build UPDATE query with!");
            return '';
        }

        const table = qb.from_array.toString();

        const limit_to = qb.limit_to[0] || false;
        const offset_val = qb.offset_val[0] || false;

        let sql = 'UPDATE (' + table + ") SET " + valstr.join(', ');
        sql += build_where_clause(qb);
        sql += build_order_by_clause(qb);
        return build_limit_clause(sql, limit_to, offset_val);
    };

    const compile_insert = (qb, ignore, suffix='') => {
        const keys = [];
        const values = [];

        for (let i in qb.set_array) {
            const key = Object.keys(qb.set_array[i])[0];
            const val = qb.set_array[i][key];

            keys.push(key);
            values.push(val);
        }

        const verb = 'INSERT ' + (ignore === true ? 'IGNORE ' : '');

        if (qb.from_array.length === 1) {
            const table = qb.from_array.toString();
        } else {
            if (qb.from_array.length === 0) {
                throw new Error("You haven't provided any tables to build INSERT querty with!");
                return '';
            }
            throw new Error("You have provided too many tables to build INSERT query with!");
            return '';
        }

        return verb + 'INTO ' + qb.from_array[0] + ' (' + keys.join(', ') + ') VALUES (' + values.join(', ') + ')' + suffix;
    };

    // ---------------------------- ACTUAL QUERY BUILDER ----------------------------//
    return {
        where_array: [],
        where_in_array: [],
        from_array: [],
        join_array: [],
        select_array: [],
        set_array: [],            // has to be array to work as reference
        order_by_array: [],
        group_by_array: [],
        having_array: [],
        limit_to: [],             // has to be array to work as reference
        offset_val: [],         // has to be array to work as reference
        join_clause: [],
        last_query_string: [],    // has to be array to work as reference
        distinct_clause: [],    // has to be array to work as reference
        aliased_tables: [],

        reset_query: function(new_last_query,debug) {
            clear_array(this.where_array,debug);
            clear_array(this.where_in_array);
            clear_array(this.from_array);
            clear_array(this.join_array);
            clear_array(this.select_array);
            clear_array(this.set_array);
            clear_array(this.order_by_array);
            clear_array(this.group_by_array);
            clear_array(this.having_array);
            clear_array(this.limit_to);
            clear_array(this.offset_val);
            clear_array(this.join_clause);
            clear_array(this.distinct_clause);
            clear_array(this.aliased_tables);

            clear_array(this.last_query_string);
            if (typeof new_last_query === 'string') {
                this.last_query_string.push(new_last_query);
            }
        },

        where: function(key, value = null, escape) {
            if (Object.prototype.toString.call(key) === Object.prototype.toString.call({}) && typeof value === 'boolean') {
                escape = (typeof escape === 'boolean' ? escape : value);
            }

            escape = (typeof escape === 'boolean' ? escape : true);

            if (typeof key === 'string' && typeof value === 'object' && Array.isArray(value) && value.length > 0) {
                return this._where_in(key, value, false, 'AND ');
            }
            return this._where(key, value, 'AND ', escape);
        },

        or_where: function(key, value=null, escape) {
            escape = (typeof escape === 'boolean' ? escape : true);

            if (typeof key === 'string' && typeof value === 'object' && Array.isArray(value) && value.length > 0) {
                return this._where_in(key, value, false, 'OR ');
            }
            return this._where(key, value, 'OR ', escape);
        },

        _where: function(key, value=null, type='AND ', escape) {
            escape = (typeof escape === 'boolean' ? escape : true);

            // Must be an object or a string
            if (Object.prototype.toString.call(key) !== Object.prototype.toString.call({})) {
                // If it's not an object, it must be a string
                if (typeof key !== 'string') {
                    throw new Error("where(): If first parameter is not an object, it must be a string. " + typeof key + " provided.");
                } else {
                    // If it is a string, it can't be an empty one
                    if (key.length == 0) {
                        throw new Error("where(): No field name or query provided!");
                    }
                }

                // If it's a actual where clause string (with no paranthesis),
                // not just a field name, split it into individual parts to escape it properly
                if (/(<=|>=|<>|>|<|!=|=)/.test(key) && key.indexOf('(') === -1 && escape === true) {
                    const filters = key.split(/\s+(AND|OR)\s+/i);
                    if (filters.length > 1) {
                        const that = this;
                        const parse_statement = (statement,joiner) => {
                            const parsed = statement.match(/^([^<>=!]+)(<=|>=|<>|>|<|!=|=)(.*)$/);
                            if (parsed.length >= 4) {
                                const key = parsed[1].trim() + (parsed[2].trim() !== '=' ? ' ' + parsed[2].trim() : '');
                                const value = parsed[3].trim().replace(/^((?:'|"){1})(.*)/, "$2").replace(/'$/,'');
                                if (joiner === null || /AND/i.test(joiner)) {
                                    that.where(key, value, true);
                                } else {
                                    that.or_where(key, value, true);
                                }
                            }
                        };
                        parse_statement(filters.shift(),null);
                        while (filters.length > 0) {
                            const joiner = filters.shift();
                            const statement = filters.shift();
                            parse_statement(statement, joiner);
                        }
                        return this;
                    }
                }

                const key_array = {};
                key_array[key] = value;
                key = key_array;
            }

            if (Object.keys(key).length == 0) {
                throw new Error("where(): You haven't provided any key value pairs to limit the resultset by.");
            }

            for (let k in key) {
                let v = key[k];

                if (typeof v === 'object' && Array.isArray(v) && v.length > 0) {
                    return this._where_in(k,v,false,type,escape);
                }

                const prefix = (this.where_array.length == 0 ? '' : type);

                if (v === null && !has_operator(k)) {
                    k += ' IS NULL';
                }

                if (v !== null) {
                    if (escape === true) {
                        k = protect_identifiers(this,k,escape);
                        v = ' ' + qb_escape(this,v);
                    }

                    if (escape === false && Object.prototype.toString.call(key) === Object.prototype.toString.call({})) {
                        v = ' ' + qb_escape(this,v);
                    }

                    if (!has_operator(k)) {
                        k += ' =';
                    }
                }
                else {
                    k = protect_identifiers(this,k,escape);
                }

                if (v) {
                    this.where_array.push(prefix+k+v);
                }
                else {
                    this.where_array.push(prefix+k);
                }
            }

            return this;
        },

        where_in: function(key, values, escape) {
            return this._where_in(key,values,false,'AND ', escape);
        },

        or_where_in: function(key, values, escape) {
            return this._where_in(key,values,false,'OR ', escape);
        },

        where_not_in: function(key, values, escape) {
            return this._where_in(key,values,true,'AND ', escape);
        },

        or_where_not_in: function(key, values, escape) {
            return this._where_in(key,values,true,'OR ', escape);
        },

        _where_in: function(key='', values=[], not, type='AND ', escape) {
            not = (not ? ' NOT' : '');
            escape = (typeof escape === 'boolean' ? escape : true);

            if (typeof key !== 'string' || (typeof key === 'string' && key.length == 0)) {
                throw new Error("where_" + (not === '' ? '' : not.toLowerCase() + '_') + "in(): Invalid field name provided.");
            }

            // Values must be an array...
            if (!Array.isArray(values)) {
                throw new Error("where_" + (not === '' ? '' : not.toLowerCase() + '_') + "in(): Invalid second parameter provided--it must be an array of scalar values.");
            }
            else {
                if (values.length == 0) {
                    throw new Error("where_" + (not === '' ? '' : not.toLowerCase() + '_') + "in(): You have provided an empty list of values to limit resultset by.");
                }
            }

            for (let i in values) {
                this.where_in_array.push(qb_escape(this,values[i]));
            }

            const prefix = (this.where_array.length == 0 ? '' : type);
            const where_in = prefix + protect_identifiers(this,key,escape) + not + " IN (" + this.where_in_array.join(', ') + ")";
            this.where_array.push(where_in);

            // reset the array for multiple calls
            clear_array(this.where_in_array);
            return this;
        },

        like: function(field, match, side) {
            return this._like(field, match, 'AND ', side, '');
        },

        not_like: function(field, match, side) {
            return this._like(field, match, 'AND ', side, ' NOT');
        },

        or_like: function(field, match, side) {
            return this._like(field, match, 'OR ', side, '');
        },

        or_not_like: function(field, match, side) {
            return this._like(field, match, 'OR ', side, ' NOT');
        },

        _like: function(field, match, type='AND ', side='both', not='') {
            match = (/^(string|number|boolean)$/.test(typeof match) ? match : null);

            if (typeof field === 'string' && field.length == 0) {
                throw new Error("like(): The field you provided is empty.");
            }
            else if (typeof field === 'object' && (field.length == 0 || Object.keys(field).length === 0)) {
                throw new Error("like(): The object you provided is empty.");
            }
            else if (!/^(string|object)$/.test(typeof field)) {
                throw new Error("like(): You have provided an invalid value as the first parameter. Only valid strings and objects are allowed.");
            }

            if (Object.prototype.toString.call(field) !== Object.prototype.toString.call({})) {
                if (match === null) {
                    throw new Error("like(): Since your first parameter is a string, your second param must a valid number, boolean, or string.");
                }

                const field_array = {};
                field_array[field] = match;
                field = field_array;
            }

            for(let k in field) {
                let like_statement;
                const v = field[k];
                k = protect_identifiers(this,k.trim());

                // Make sure value is only string, number, or boolean
                if (!/^(string|number|boolean)$/.test(typeof v)) {
                    throw new Error("like(): You have provided an invalid value as the second parameter. Only valid strings, numbers, and booleans are allowed.");
                }
                // If number, don't allow Infinity or NaN
                else if (typeof v === 'number' && (v === Infinity || (v !== +v))) {
                    throw new Error("like(): You have provided an invalid number value as the second parameter. Only valid strings, numbers, and booleans are allowed.");
                }

                if (side === 'none') {
                    like_statement =  k + not + ' LIKE ' + "'" + v + "'";
                }
                else if (side === 'before' || side === 'left') {
                    like_statement = k + not + ' LIKE ' + "'%" + v + "'";
                }
                else if (side === 'after' || side === 'right') {
                    like_statement = k + not + ' LIKE ' + "'" + v + "%'";
                }
                else if (side === 'both') {
                    like_statement = k + not + ' LIKE ' + "'%" + v + "%'";
                }
                else {
                    throw new Error("like(): Invalid direction provided!");
                }

                this._where(like_statement,null,type,false);
            }

            return this;
        },

        from: function(from_param) {
            if (!Array.isArray(from_param)) {
                from_param = [from_param];
            }
            for (let i in from_param) {
                let val = from_param[i];

                if (typeof val !== 'string' || val.trim() === '') continue;

                if (val.indexOf(',') !== -1) {
                    const objects = val.split(',');
                    for (let j in objects) {
                        const v = objects[j].trim();

                        track_aliases(this,v);

                        this.from_array.push(protect_identifiers(this,v,true));
                    }
                }
                else {
                    val = val.trim();

                    // Extract any aliases that might exist.  We use this information
                    // in the protect_identifiers function to know whether to add a table prefix
                    track_aliases(this,val);

                    this.from_array.push(protect_identifiers(this,val,true));
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

            const valid_directions = ['LEFT','RIGHT','OUTER','INNER','LEFT OUTER','RIGHT OUTER'];

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

            track_aliases(this,table);

            // Split multiple conditions
            const regex = /\sAND\s|\sOR\s/ig;
            const m = relation.match(regex);
            const matches = [];
            let k, temp, temp_match, match;
            if (escape === true && m) {
                while(k = regex.exec(relation)) {
                    matches.push(k);
                }

                let new_relation = '';
                matches.push(['']);
                matches[(matches.length - 1)].index = relation.length;
                for (let j = 0, c = matches.length, s = 0; j < c; s = matches[j].index + matches[j][0].length, j++) {
                    temp = relation.substr(s, matches[j].index - s);
                    temp_match = temp.match(/([\[\]\w\.'-]+)(\s*[^\"\[`'\w]+\s*)(.+)/i);
                    new_relation += (temp_match ? protect_identifiers(this,temp_match[1],escape) + temp_match[2] + protect_identifiers(this,temp_match[3],escape) : temp);
                    new_relation += matches[j][0];
                }

                relation = ' ON ' + new_relation;
            }

            // Split apart the condition and protect the identifiers
            else if (escape === true && /([\[\]\w\.'-]+)(\s*[^\"\[`'\w]+\s*)(.+)/i.test(relation)) {
                match = relation.match(/([\[\]\w\.'-]+)(\s*[^\"\[`'\w]+\s*)(.+)/i)
                relation = ' ON ' + protect_identifiers(this,match[1],true) + match[2] + protect_identifiers(this,match[3],true);
            }
            else if (!has_operator(relation)) {
                relation = ' USING (' + (escape ? escape_identifiers(relation) : relation) + ')';
            }
            else if (relation && escape === false) {
                relation = ' ON ' + relation;
            }
            else {
                relation = ' ';
            }

            // Do we want to escape the table name?
            if (escape === true) {
                table = protect_identifiers(this,table,true);
            }

            const join = direction + 'JOIN ' + table + relation;

            this.join_array.push(join);
            return this;
        },

        select: function(select,escape) {
            // First param must be a non-empty string or array
            if (typeof select === 'string') {
                select = select.trim();
                if (select.length == 0) {
                    throw new Error("Your select string is empty!");
                }
            }
            else if (Array.isArray(select)) {
                if (select.length == 0) {
                    throw new Error("Your select array is empty!");
                }
            }
            else {
                throw new Error("Select method requires a string or array to be passed in the first parameter!");
            }

            if (typeof escape !== 'boolean') escape = true;

            // Split statements out into individual ones by comma (unless there is a function or subquery with commas in it)
            if (typeof select === 'string') {
                if (select.indexOf(')') === -1) {
                    select = select.split(',');
                } else {
                    if (escape === true) {
                        // Prevent it from trying to parse select statements with functions and if statements
                        if (/\w\s?\(/.test(select)) throw new Error("Select statements with subqueries or functions cannot be escaped! Please escape manually and pass FALSE as the second paramter to the select method.");

                        // Identify individual statements within select string
                        let m, open_paren_index, inner_parenthesis;
                        const reg = /\)/g;
                        while ((m = reg.exec(select) !== null)) {
                            open_paren_index = m.input.substring(0, m.index).lastIndexOf('(');
                            if (open_paren_index !== -1) {
                                inner_parenthesis = m.input.substring((open_paren_index + 1), m.index);
                                if (inner.parenthesis.indexOf(',') !== -1) {
                                    throw new Error("Select statements with subqueries or functions cannot be escaped! Please escape manually and pass FALSE as the second paramter to the select method.");
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        select = [select];
                    }
                }
            }

            for (let i in select) {
                const val = select[i].trim();

                if (val !== '') {
                    this.select_array.push(protect_identifiers(this,val,escape));
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

        _min_max_avg_sum: function(select='',alias='',type='MAX') {

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
                alias = create_aliases_from_table(select.trim());
            }

            const sql = type + '(' + protect_identifiers(this,select.trim()) + ') AS ' + alias;

            this.select_array.push(sql);

            return this;
        },

        distinct: function(do_distinct) {
            do_distinct = (typeof do_distinct !== 'boolean' ? true : do_distinct);

            if (do_distinct) {
                clear_array(this.distinct_clause);
                this.distinct_clause.push('DISTINCT ');
            }
            else {
                clear_array(this.distinct_clause);
            }
            return this;
        },

        group_by: function(by) {
            if (typeof by === 'string') {
                by = by.trim();
                if (by.length <= 0) {
                    throw new Error("You haven't provided any fields to group by!");
                }
                by = by.split(',');
            }

            if (!Array.isArray(by)) {
                throw new Error("You have provided an invalid value to the group_by() method. Only strings and arrays of strings are allowed.");
            }

            if (by.length <= 0) {
                throw new Error("You haven't provided any fields to group by!");
            }

            for (let key in by) {
                if (typeof by[key] !== 'string') {
                    throw new Error("You have provided an invalid value to the group_by() method. Only strings and arrays of strings are allowed!");
                }

                const val = by[key].trim();

                if (val !== '') {
                    this.group_by_array.push(protect_identifiers(this,val));
                }
            }
            return this;
        },

        having: function(key, value, escape) {
            escape = (typeof escape !== 'boolean' ? true : escape);
            return this._having(key, value, 'AND ', escape);
        },

        or_having: function(key, value, escape) {
            escape = (typeof escape !== 'boolean' ? true : escape);
            return this._having(key, value, 'OR ', escape);
        },

        _having: function(key, value, type='AND ', escape) {

            let m;
            let key_array = {};
            const key_is_object = Object.prototype.toString.call(key) === Object.prototype.toString.call({});
            const key_is_array = Array.isArray(key);

            if (/^(string|number|boolean)$/.test(typeof value)) { // if the value is a string, number, or boolean...
                if (typeof key !== 'string' || /^\W+$/i.test(key)) { // if the key is not a string...
                    throw new Error("having(): The value you provided when calling having() will be ignored since the first parameter is not a single field provided in string form.");
                }
                key_array[key] = value;
                key = key_array;
            }
            else if (typeof value === 'undefined' || value === null) {
                if (key_is_object === false) {
                    if (typeof key === 'string') {
                        if (value === null) {
                            key_array[key] = null;
                            key = key_array;
                        }
                        else {
                            key = extract_having_parts(key,key_array);
                        }
                    }
                    else if (key_is_array === true) {
                        //console.log("Key is NOT a string");
                        for (let i in key) {
                            if (typeof key[i] !== 'string') {
                                throw new Error("having(): You've provided an unparseable format to the having() method..");
                            }
                            else {
                                key_array = extract_having_parts(key[i],key_array);
                            }
                        }
                        key = key_array;
                    }
                }
            }
            else {
                throw new Error("Improper value supplied as the second parameter (" + typeof value + ") of the having() method.");
            }


            for (let k in key) {
                let v = key[k];
                const prefix = (this.having_array.length == 0 ? '' : type);

                if (escape === true) {
                    k = protect_identifiers(this,k);
                }

                if (v === null) {
                    k += ' IS';
                }
                else if (!has_operator(k)) {
                    k += ' =';
                }

                if (v != '') {
                    v = ' ' + qb_escape(this,v);
                }

                this.having_array.push(prefix + k + v);
            }

            return this;
        },

        order_by: function(orderby, direction) {
            let m;
            const rand_word = 'RAND()';
            direction = (typeof direction === 'string' ? direction.toLowerCase().trim() : '');

            // Don't need to do anything below if the direction provided is random
            if ((direction === 'random' || direction === 'rand' || direction === 'rand()')) {
                this.order_by_array.push(rand_word);
                return this;
            }

            // normalize orderby to be an array of items
            if (!Array.isArray(orderby)) {
                if (typeof orderby === 'string') {
                    orderby = orderby.trim();
                    if (orderby.length == 0) {
                        throw new Error("You haven't provided any fields to order by!!");
                    }
                    orderby = orderby.split(',');
                } else if (!orderby && (/(random|RAND|RAND\(\))/i.test(direction))) {
                    this.order_by_array.push(rand_word);
                    return this;
                }
                else {
                    throw new Error("No field provided to order by!");
                }
            }

            if (orderby.length === 0) {
                throw new Error("You haven't provided any fields to order by!");
            }

            for (let i in orderby) {
                orderby[i] = orderby[i].replace(/\s+/g, ' ');

                if (m = orderby[i].match(/([^\s]+)\s+(ASC|DESC|RAND\(\))/i)) {
                    if (m[2].trim() === 'RAND()') {
                        this.order_by_array.push(rand_word);
                        return this;
                    }
                    orderby[i] = {field: protect_identifiers(this,m[1].trim()), direction: m[2].trim().toUpperCase()};
                } else {
                    if (/^(ASC|DESC)$/i.test(direction) || direction === '') {
                        orderby[i] = {field: protect_identifiers(this,orderby[i].trim()), direction: (direction !== '' ? direction.toUpperCase() : 'ASC')};
                    } else {
                        throw new Error("Invalid direction provided in order_by method! Only 'ASC', 'DESC', and 'RAND' are allowed!");
                    }
                }

                this.order_by_array.push(orderby[i].field + ' ' + orderby[i].direction);
            }

            return this;
        },

        limit: function(limit, offset) {
            clear_array(this.limit_to);
            this.limit_to.push(prepare_for_limit_and_offset(limit,'limit'));

            if (offset !== undefined) {
                return this.offset(offset);
            }

            return this;
        },

        offset: function(offset) {
            clear_array(this.offset_val);
            this.offset_val.push(prepare_for_limit_and_offset(offset,'offset'));
            return this;
        },

        set: function(key, value, escape) {
            escape = (typeof escape === 'boolean' ? escape : true);

            if (typeof key === 'string') {
                // Convert key and value params to {key: value}
                key = key.trim();
                if (key.length == 0) {
                    throw new Error("set(): Invalid field name provided!");
                }

                if (typeof value === 'undefined')
                    throw new Error("set(): First param was string but no value (second param) provided to set!");

                const key_array = {};
                key_array[key] = value;
                key = key_array;
            }
            else if (Object.prototype.toString.call(key) === Object.prototype.toString.call({})) {
                if (Object.keys(key).length === 0) {
                    throw new Error("set(): The object you provided is empty.");
                }

                if (typeof value !== 'undefined' & value !== null) {
                    throw new Error("set(): The value you provided in the second parameter will be ignored since you passed an object as the first parameter.");
                }
            }
            else {
                throw new Error("set(): First parameter must be a non-empty string or non-empty object! " + typeof key + " provided.");
            }


            // Add each key:value pair to the set_array
            for (let i in key) {
                let v = key[i];
                if (typeof v === 'undefined') continue;

                if (v instanceof Date) v = v.toString();

                if (!/^(number|string|boolean)$/.test(typeof v) && v !== null) {
                    throw new Error("set(): Invalid value provided! (provided: " + v + " (type: " + (typeof v) + ")");
                }
                else if (typeof v === 'number' && (v === Infinity || v !== +v)) {
                    throw new Error("set(): Infinity and NaN are not valid values in MySQL!");
                }

                // Escape the key to be DRY
                const escaped_key = protect_identifiers(this,i,escape);

                // Build a temporary object with escaped key and val
                const temp = {};
                if (escape === false) {
                    temp[escaped_key] = v;
                } else {
                    temp[escaped_key] = qb_escape(this,v);
                }

                // Determine if this key has already been set
                let found_index = null;
                for (let j in this.set_array) {
                    if (this.set_array[j].hasOwnProperty(escaped_key)) {
                        found_index = j;
                        break;
                    }
                }

                // Update value if key already set or add if not found
                if (found_index !== null) {
                    this.set_array[found_index] = temp;
                } else {
                    this.set_array.push(temp);
                }
            }

            //console.dir(this.set_array);

            return this;
        },

        insert: function(table, set, ignore, suffix) {
            table = table || ''
            ignore = (typeof ignore !== 'boolean' ? false : ignore);
            suffix = (typeof suffix !== 'string' ? '' : ' ' + suffix);

            if (/^(number|boolean)$/.test(typeof set) || (typeof set == 'string' && set !== '') || Object.prototype.toString.call(set) === Object.prototype.toString.call(/test/)) {
                throw new Error("insert(): Invalid data provided to insert into database!");
            }

            if (Array.isArray(set)) {
                return this.insert_batch(table, set, ignore, suffix);
            }

            if (set !== null) {
                if (Object.prototype.toString.call(set) === Object.prototype.toString.call({}) && Object.keys(set).length > 0) {
                    this.set(set);
                }
            }

            if (typeof table !== 'string') {
                throw new Error("insert(): Table parameter must be a string!");
            }

            table = table.trim();

            if (table !== '' && !(/^[a-zA-Z0-9\$_]+(\.[a-zA-Z0-9\$_]+)?$/).test(table)) {
                throw new Error("insert(): Invalid table name ('" + table + "') provided!");
            }

            if (table === '') {
                if (this.from_array.length == 0) {
                    throw new Error('insert(): No tables set to insert into!');
                }
                table = this.from_array[0];
            } else {
                clear_array(this.from_array);
                this.from(table);
            }
            return compile_insert(this, ignore, suffix);
        },

        insert_ignore: function(table, set, suffix) {
            return this.insert(table, set, true, suffix);
        },

        insert_batch: function(table,set=null,ignore,suffix) {

            const orig_table = table = table || '';
            ignore = (typeof ignore !== 'boolean' ? false : ignore);
            suffix = (typeof suffix !== 'string' ? '' : ' ' + suffix);
            if (suffix == ' ') suffix = '';

            if (typeof table !== 'string') {
                throw new Error("insert(): Table parameter must be a string!");
            }

            table = table.trim();

            if (table !== '' && !/^[a-zA-Z0-9\$_]+(\.[a-zA-Z0-9\$_]+)?$/.test(table)) {
                throw new Error("insert(): Invalid table name ('" + table + "') provided!");
            }

            if (table == '') {
                if (this.from_array.length === 0) {
                    throw new Error("insert_batch(): You have not set any tables to insert into.");
                }
                table = this.from_array[0];
            } else {
                clear_array(this.from_array);
                this.from(table);
            }

            if (!Array.isArray(set)) {
                throw new Error('insert_batch(): Array of objects must be provided for batch insert!');
            }

            for (let key in set) {
                const row = set[key];
                const is_object = Object.prototype.toString.call(row) == Object.prototype.toString.call({});
                if (!is_object || (is_object && Object.keys(row).length === 0)) {
                    throw new Error('insert_batch(): An invalid item was found in the data array!');
                } else {
                    for (let i in row) {
                        const v = row[i];

                        if (!/^(number|string|boolean)$/.test(typeof v) && v !== null) {
                            throw new Error("set(): Invalid value provided!");
                        }
                        else if (typeof v === 'number' && (v === Infinity || v !== +v)) {
                            throw new Error("set(): Infinity and NaN are not valid values in MySQL!");
                        }
                    }
                }
            }

            if (set.length == 0) {
                return this.insert(orig_table, {}, ignore, (suffix === '' ? null : suffix));
            }

            const map = [];
            const columns = [];

            // Obtain all the column names
            for (let key in set[0]) {
                if (set[0].hasOwnProperty(key)) {
                    if (columns.indexOf(key) == -1) {
                        columns.push(protect_identifiers(this,key));
                    }
                }
            }

            for (let i = 0; i < set.length; i++) {
                (i => {
                    const row = [];
                    for (let key in set[i]) {
                        if (set[i].hasOwnProperty(key)) {
                            row.push(qb_escape(this,set[i][key]));
                        }
                    }
                    if (row.length != columns.length) {
                        throw new Error('insert_batch(): Cannot use batch insert into ' + table + ' - fields must match on all rows (' + row.join(',') + ' vs ' + columns.join(',') + ').');
                    }
                    map.push('(' + row.join(', ') + ')');
                })(i);
            }

            const verb = 'INSERT ' + (ignore === true ? 'IGNORE ' : '');
            return verb + 'INTO ' + this.from_array[0] + ' (' + columns.join(', ') + ') VALUES ' + map.join(', ') + suffix;
        },

        get: function(table) {
            if (typeof table === 'string' || Array.isArray(table)) {
                this.from(table);
            }
            else {
                if (this.from_array.length == 0) {
                    throw new Error('You have not specified any tables to select from!');
                }
            }
            return compile_select(this);
        },

        get_where: function(table=null, where=null) {

            // Check if table is either a string or array
            if (typeof table !== 'string' && !Array.isArray(table))
                throw new Error('You must specify a table or array of tables in the first parameter of get_where()');

            // If table is a string, make sure it's not empty
            if (typeof table === 'string' && table.trim().length <= 0)
                throw new Error("Invalid table string specified!");

            // If table is array, make sure there are only strings in there and that they are non-empty strings
            if (Array.isArray(table)) {
                for (let v in table) {
                    if (typeof v !== 'string' || (typeof v === 'string' && v.trim().length <= 0)) {
                        throw new Error("Invalid table string specified in array of tables!");
                        break;
                    }
                }
            }

            this.from(table);

            if (where === null || typeof where !== 'object' || Object.keys(where).length === 0)
                throw new Error('You must supply an object of field:value pairs in the second parameter of get_where()');

            this.where(where);

            return compile_select(this);
        },

        count: function(table) {
            if (typeof table === 'string') {
                this.from(table);
            }

            const sql = 'SELECT COUNT(*) AS ' + protect_identifiers(this,'numrows')
                + build_from_clause(this)
                + build_join_string(this)
                + build_where_clause(this);

            return sql;
        },

        update: function(table, set, where=null) {

            table = table || '';
            set = set || null;

            // Send to batch_update if the data param is an array
            if (Array.isArray(set)) {
                let index = null;
                if (set.length > 0) {
                    if (Object.prototype.toString.call(set[0]) === Object.prototype.toString.call({})) {
                        index = Object.keys(set[0])[0];
                    }
                }
                if (index) {
                    return this.update_batch(table, set, index, where);
                } else {
                    throw new Error("update(): update_batch attempted but could not ascertain a valid index to use from the dataset provided.");
                }
            }

            // If set is a number, boolean, a non-empty string, or regex, fail
            if (/^(number|boolean)$/.test(typeof set) || (typeof set == 'string' && set !== '') || Object.prototype.toString.call(set) === Object.prototype.toString.call(/test/)) {
                throw new Error("update(): Invalid data provided to update database!");
            }

            // If data object was provided, set it
            if (set !== null) {
                if (Object.prototype.toString.call(set) === Object.prototype.toString.call({}) && Object.keys(set).length > 0) {
                    this.set(set);
                } else {
                    throw new Error("update(): Empty data object provided. This is not allowed.");
                }
            }

            // Fail if, at this point, nothing has been set
            if (this.set_array.length == 0) {
                throw new Error("update(): You must set some field value pairs to update using the set method or via an object passed to the second parameter of the update method!");
            }

            // NOTE: If falsy table provided, table will have been converted to an empty string...
            if (typeof table !== 'string') {
                throw new Error("update(): Table parameter must be a string!");
            }

            table = table.trim();

            // Table name must be in a legitimate format
            if (table !== '' && !/^[a-zA-Z0-9\$_]+(\.[a-zA-Z0-9\$_]+)?$/.test(table)) {
                throw new Error("update(): You have not set any tables to update!");
            }

            // If table not supplied, it must have been supplied already
            if (table == '') {
                if (this.from_array.length == 0) {
                    throw new Error('update(): No tables set to update!');
                }
                table = this.from_array[0];
            } else {
                clear_array(this.from_array);
                this.from(table);
            }

            // Set where array if a where statement was provided
            if (where !== null) {
                this.where(where);
            }

            return compile_update(this);
        },

        update_batch: function(table='', set=null, index=null, where=null) {


            // Make sure an index has been provided!
            if (typeof index !== 'string' || (typeof index === 'string' && index.length === 0)) {
                throw new Error("update_batch(): Invalid index provided to generate batch update query!");
            }

            // Check to make sure we have a dataset
            if (!Array.isArray(set)) {
                throw new Error("update_batch(): Array of object expected and non-array received.");
            }

            // Make sure our dataset isn't emtpy
            if (set.length === 0) {
                throw new Error("update_batch(): You must supply some data to batch update the table with.");
            }

            // Make sure each item in the dataset has the specified index and then add data to set_array
            //console.dir(set);
            for (let i in set) {
                const clean = {};
                const row = set[i];
                if (Object.prototype.toString.call(row) === Object.prototype.toString.call({}) && Object.keys(row).length > 0) {
                    const keys = Object.keys(row);
                    if (keys.indexOf(index) !== -1) {
                        for (let j in row) {
                            clean[protect_identifiers(this, j)] = qb_escape(this, row[j]);
                        }
                        this.set_array.push(clean);
                    }
                } else {
                    throw new Error("update_batch(): You have supplied an invalid object to batch update!");
                }
            }

            // Fail if, at this point, nothing has been set
            if (this.set_array.length == 0) {
                throw new Error("update_batch(): You must provide some data to batch update!");
            }

            // NOTE: If falsy table provided, table will have been converted to an empty string...
            if (typeof table !== 'string') {
                throw new Error("update(): Table parameter must be a string!");
            }

            table = table.trim();

            // Table name must be in a legitimate format
            if (table !== '' && !/^[a-zA-Z0-9\$_]+(\.[a-zA-Z0-9\$_]+)?$/.test(table)) {
                throw new Error("update(): You have not set any tables to update!");
            }

            // If table not supplied, it must have been supplied already
            if (table == '') {
                if (this.from_array.length == 0) {
                    throw new Error('No tables set to insert into!');
                }
                table = this.from_array[0];
            } else {
                clear_array(this.from_array);
                this.from(table);
            }

            // Set where array if a where statement was provided
            if (where != null) {
                this.where(where);
            }

            // Verify there is a table in the from_array
            if (this.from_array.length !== 1) {
                if (this.from_array.length === 0) {
                    throw new Error("You haven't provided any tables to build batch UPDATE query with!");
                }
                throw new Error("You have provided too many tables to build batch UPDATE query with!");
            }

            table = this.from_array.toString();


            // Limit to 100 rows per batch
            const batches = [];
            for (let i = 0, total = this.set_array.length; i < total; i += 100) {
                const when_then = {};
                const ids = [];
                const where = (this.where_array.length > 0 ? build_where_clause(this) + ' AND ' : '');
                const chunk = this.set_array.slice(i,100);

                // Escape the index
                index = protect_identifiers(this, index);

                for (let j in chunk) {
                    ids.push(chunk[j][index]);

                    const keys = Object.keys(chunk[j]);
                    for (let k in keys) {
                        if (keys[k] != index) {
                            if (!when_then.hasOwnProperty(keys[k])) {
                                when_then[keys[k]] = [];
                            }
                            when_then[keys[k]].push('WHEN ' + index + ' = ' + ids[j] + ' THEN ' + chunk[j][keys[k]] + ' ');
                        }
                    }
                }

                // Build the actual SQL statement
                let sql = 'UPDATE (' + table + ') SET ';
                let cases = '';

                for (let l in when_then) {
                    cases += l + ' = CASE ';

                    for (let m in when_then[l]) {
                        cases += when_then[l][m];
                    }

                    cases += 'ELSE ' + l + ' END, ';
                }

                sql += cases.substr(0, cases.length - 2);
                sql += ' WHERE ' + where + index + ' IN (' + ids.join(',') + ')';

                // Add query to batch
                batches.push(sql);
            }

            return batches;
        },

        delete: function(table, where) {
            if (typeof table == 'string' && table.trim().length > 0) {
                clear_array(this.from_array);
                this.from(table);
            }

            if (Object.prototype.toString.call(where) === Object.prototype.toString.call({})) {
                if (Object.keys(where).length == 0) {
                    throw new Error("where(): The object you provided to limit the deletion of rows is empty.");
                }
                else {
                    this.where(where);
                }
            }

            return compile_delete(this);
        },

        get_compiled_select: function(table) {
            if (typeof table !== 'undefined') {
                track_aliases(this,table);
                this.from(table);
            }
            else {
                if (this.from_array.length == 0) {
                    throw new Error('You have not specified any tables to build a select statement with!');
                    return this;
                }
            }

            return compile_select(this);
        },

        get_compiled_delete: function(table) {
            if (typeof table !== 'function') {
                track_aliases(this,table);
                this.from(table);
            }

            return compile_delete(this);
        },

        get_compiled_update: function(table) {
            if (typeof table !== 'function') {
                track_aliases(this,table);
                this.from(table);
            }
            return compile_update(this);
        },

        get_compiled_insert: function(table) {
            if (typeof table !== 'function') {
                track_aliases(this,table);
                this.from(table);
            }
            return compile_insert(this);
        },

        compile_select: function(table) {
            return this.get_compiled_select(table);
        },

        compile_delete: function(table) {
            return this.get_compiled_delete(table);
        },

        compile_update: function(table) {
            return this.get_compiled_update(table);
        },

        compile_insert: function(table) {
            return this.get_compiled_insert(table);
        },

        last_query: function() {
            return this.last_query_string[0] || '';
        },

        escape: function(val) {
            return qb_escape(this, val);
        },

        empty_table: function(table) {
            if (typeof table === 'string' && table.trim().length > 0) {
                clear_array(this.from_array);
                this.from(table);
            }

            if (this.from_array.length === 0) {
                throw new Error('empty_table(): You have not specified a table to empty!');
                return '';
            }

            return "DELETE FROM " + this.from_array[0];
        },

        truncate: function(table) {
            if (typeof table === 'string' && table.trim().length > 0) {
                clear_array(this.from_array);
                this.from(table);
            }

            if (this.from_array.length === 0) {
                throw new Error('truncate(): You have not specified a table to truncate!');
                return '';
            }

            return "TRUNCATE " + this.from_array[0];
        },
    }
};

exports.QueryBuilder = QueryBuilder;
