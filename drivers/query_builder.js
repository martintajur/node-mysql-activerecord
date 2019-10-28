class GenericQueryBuilder {
    constructor() {
        this.reserved_identifiers = ['*'];

        this.where_array = [];
        this.where_in_array = [];
        this.from_array = [];
        this.join_array = [];
        this.select_array = [];
        this.set_array = [];            // has to be array to work as reference
        this.order_by_array = [];
        this.group_by_array = [];
        this.having_array = [];
        this.limit_to = [];             // has to be array to work as reference
        this.offset_val = [];           // has to be array to work as reference
        this.join_clause = [];
        this.last_query_string = [];    // has to be array to work as reference
        this.distinct_clause = [];      // has to be array to work as reference
        this.aliased_tables = [];
        this.returning_ids = [];
    }

    // ------------------------------ GENERIC METHODS ------------------------------//
   _array_values(item) {
       const keys = Object.keys(item);
       const length = keys.length;
       const values = Array(length);
       for (let i = 0; i < length; i++) {
         values[i] = item[keys[i]];
       }
       return values;
   }

   // Simply setting all properties to [] causes reference issues in the parent class.
   _clear_array(a, debug) {
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
   }

   _extract_having_parts(key, key_array) {
       let m;
       key = key.trim().replace(/\s+/g,' ');
       const str_condition  = /^([^\s]+\s(<=|>=|<>|>|<|!=|=))+\s"([^"]+)"$/;
       const sstr_condition = /^([^\s]+\s(<=|>=|<>|>|<|!=|=))+\s'([^']+)'$/;
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

   _prepare_for_limit_and_offset(item, type = 'limit') {
       type = type.toLowerCase();

       if (!/^(string|number)$/.test(typeof item)) {
           throw new Error("Only integers or integers in the form of a string are allowed");
       }

       if (typeof item === 'string') {
           item = item.trim();
           if (!/^\d+$/.test(item)) {
               throw new Error(`The string you provided to ${type} by contains non-integer values--this isn't allowed.`);
           }
           // Force to an integer
           item = parseInt(item);
       }

       // Make sure the number is a good one
       if (typeof item === 'number') {
           // Check for NaN and Infinity
           if (item !== +item || item === Infinity) {
               throw new Error(`You have not provided a valid number to ${type} by!`);
           }

           // Make sure it's positive
           if (item < 0) {
               throw new Error(`Only positive integers are allowed when ${(type == 'offset' ? 'offset' : 'limit')}ing SQL results!`);
           }

           // Only allow integers
           if (item % 1 !== 0) {
               throw new Error(`You cannot ${type} a SQL resultset with a floating point value!`);
           }
       }
       else {
           throw new Error(`There was an unrecoverable error while parsing the value provided in your ${type} statement.`);
       }

       return item;
   }

   // ---------------------------------------- SQL ESCAPE FUNCTIONS ------------------------ //
   /**
    * Escape the SQL Identifiers
    *
    * This function escapes column and table names
    *
    * @param	mixed	item	Identifier to escape
    * @param	bool	split	Whether to split identifiers when a dot is encountered
    * @return	mixed
    */
   _escape_identifiers(item='*', split=true) {
       if (item === '*') return item;

       // If object is supplied, escape the value of each key
       if (Object.prototype.toString.call(item) === Object.prototype.toString.call({})) {
           for (let i in item) {
               item[i] = this._escape_identifiers(item[i]);
           }
           return item;
       }

       // Avoid breaking functions and literal values inside queries
       else if ((typeof item === 'string' && /^\d+$/.test(item)) || item[0] === "'" || item.indexOf('(') !== -1) {
           return item;
       }

       let str;
       let escape_chars = [];

       if (Array.isArray(this.escape_char)) {
           escape_chars = this.escape_char;
       } else {
           escape_chars[0] = escape_chars[1] = this.escape_char;
       }

       this.reserved_identifiers.forEach(v => {
           if (item.indexOf(v) === -1) {
               return item.replace(RegExp(`\\${escape_chars[0]}?([^\\${escape_chars[1]}\.]+)\\${escape_chars[1]}?\.`, 'ig'), `${escape_chars[0]}$1${escape_chars[1]}.`);
           }
       });

       const dot = (split !== false ? '\.' : '');
       return item.replace(RegExp(`\\${escape_chars[0]}?([^\\${escape_chars[1]}${dot}]+)\\${escape_chars[1]}?(\.)?`, 'ig'), `${escape_chars[0]}$1${escape_chars[1]}$2`);
   }

   /**
    * Protect Identifiers
    *
    * Takes a column or table name (optionally with an alias) and inserts
    * the table prefix onto it. Some logic is necessary in order to deal with
    * column names that include the path. Consider a query like this:
    *
    * SELECT hostname.database.table.column AS c FROM hostname.database.table
    *
    * Or a query with aliasing:
    *
    * SELECT m.member_id, m.member_name FROM members AS m
    *
    * Since the column name can include up to four segments (host, DB, table, column)
    * or also have an alias prefix, we need to do a bit of work to figure this out and
    * insert the table prefix (if it exists) in the proper position, and escape only
    * the correct identifiers.
    *
    * @param	string   item
    * @param	bool     prefix_single
    * @param	mixed    protect_identifiers
    * @param	bool     field_exists
    * @return	string
    */
    _protect_identifiers(item, prefix_single=false, protect_identifiers=null, field_exists=true) {
        if (item === '') return item;

        protect_identifiers = (typeof protect_identifiers === 'boolean' ? protect_identifiers : true);

        if (Object.prototype.toString.call(item) === Object.prototype.toString.call({})) {
            const escaped_array = {};

            for (let k in item) {
                const v = item[k];
                escaped_array[this._protect_identifiers(k)] = this._protect_identifiers(v);
            }
            return escaped_array;
        }

        // Make sure item is a string...
        if (typeof item !== 'string') throw new Error("Invalid item passed to _protect_identifiers:" + typeof item);

        // Convert tabs or multiple spaces into single spaces
        item = item.trim().replace(/\s+/g, ' ');

        let alias = '';

        // This is basically a bug fix for queries that use MAX, MIN, subqueries, etc.
        // If a parenthesis is found we know that we do not need to
        // escape the data or add a prefix.
        const match = /[\(\)\']{1}/.exec(item)
        if (match && match.index !== item.length) {
            const has_alias = item.lastIndexOf(')');
            if (has_alias >= 0) {
                alias = item.substr(has_alias + 1).replace(/\sAS\s/i,'').trim();
                alias = this._escape_identifiers(alias);
                if (alias != '')
                    alias = ' AS ' + alias;
                item = item.substr(0, has_alias + 1);
            } else {
                alias = '';
            }

            return item + alias;
        }

        // If the item has an alias declaration we remove it and set it aside.
        // Basically we remove everything to the right of the first space
        if (/\sAS\s/ig.test(item)) {
            const offset = item.indexOf(item.match(/\sAS\s/ig)[0]);
            alias = (protect_identifiers ? item.substr(offset, 4) + this._escape_identifiers(item.slice(offset + 4), false) : item.substr(offset));
            item = item.substr(0, offset);
        }
        else if (item.indexOf(' ') !== -1) {
            const alias_index = item.indexOf(' ');

            alias = (protect_identifiers && ! this._has_operator(item.substr(alias_index + 1)) ? ' ' + this._escape_identifiers(item.substr(alias_index + 1)) : item.substr(alias_index));
            item = item.substr(0, alias_index);
        }

        // Break the string apart if it contains periods, then insert the table prefix
        // in the correct location, assuming the period doesn't indicate that we're dealing
        // with an alias. While we're at it, we will escape the components
        if (item.indexOf('.') !== -1) {
            let parts = item.split('.');
            const first_seg = parts[0].trim();//.replace(/`/g,'');

            // Does the first segment of the exploded item match
            // one of the aliases previously identified?  If so,
            // we have nothing more to do other than escape the item
            if (this.aliased_tables.indexOf(first_seg) !== -1) {
                if (protect_identifiers === true) {
                    parts = parts.map((v,i) => {
                        if (!this.reserved_identifiers.includes(v)) {
                            return this._escape_identifiers(v);
                        }
                        else {
                            return v;                            
                        }
                    });

                    item = parts.join('.');
                }
                return item + alias;
            }

            if (protect_identifiers === true) {
                item = this._escape_identifiers(item);
            }

            return item + alias;
        }
        if (protect_identifiers === true) {
            item = this._escape_identifiers(item);
        }

        return (item + alias).trim();
    }

   _track_aliases(table) {
       if (Object.prototype.toString.call(table) === Object.prototype.toString.call({})) {
           for (let i in table) {
               const t = table[i];
               this._track_aliases(t);
           }
           return;
       }

       // Does the string contain a comma?  If so, we need to separate
       // the string into discreet statements
       if (table.indexOf(',') !== -1) {
           return this._track_aliases(table.split(','));
       }

       // if a table alias is used we can recognize it by a space
       if (table.indexOf(' ') !== -1) {
           // if the alias is written with the AS keyword, remove it
           table = table.replace(/\s+AS\s+/gi, ' ');

           // Grab the alias
           const alias = table.slice(table.lastIndexOf(' ')).trim().replace(/`/g,'').replace(/\[([^\]]+)\]/, "$1");

           // Store the alias, if it doesn't already exist
           if (this.aliased_tables.indexOf(alias) == -1) {
               this.aliased_tables.push(alias);
           }
       }
   }

   _create_aliases_from_table(item) {
       if (item.indexOf('.') !== -1) {
           return item.split('.').reverse()[0];
       }

       return item;
   }

   _has_operator(str) {
       if (typeof str === 'string' && str.length > 0) {
           const match = /(<|>|!|=|\sIS NULL|\sIS NOT NULL|\sEXISTS|\sBETWEEN|\sLIKE|\sCASE|\sTHEN|\sWHEN|\sIN\s*\(|\s)/i.test(str.trim());
           if (!match) {
               return false;
           }
       }
       return true;
   };

   // ---------------------------- SQL BUILD TOOLS ----------------------------//
   _build_where_clause() {
       if (this.where_array.length === 0) return '';
       return `WHERE ${this.where_array.join(" ")}`;
   };

   _build_from_clause() {
       let sql = '';
       if (this.from_array.length === 0) {
           throw new Error("You have not provided any tables, views, or store procedures for this query!!");
       }
       sql = `FROM ${this.from_array.join(', ')}`;
       return sql.trim();
   };

   _build_join_string() {
       if (this.join_array.length <= 0) return '';
       return this.join_array.join(' ');
   };

   _build_group_by_clause() {
       if (this.group_by_array.length <= 0) return '';
       return `GROUP BY ${this.group_by_array.join(', ')}`;
   };

   _build_having_clause() {
       if (this.having_array.length <= 0) return '';
       return `HAVING ${this.having_array.join(' ')}`;
   };

   _build_order_by_clause() {
       if (this.order_by_array.length <= 0) return '';
       return `ORDER BY ${this.order_by_array.join(', ')}`;
   };

   reset_query(new_last_query, debug=false) {
       this._clear_array(this.where_array, debug);
       this._clear_array(this.where_in_array);
       this._clear_array(this.from_array);
       this._clear_array(this.join_array);
       this._clear_array(this.select_array);
       this._clear_array(this.set_array);
       this._clear_array(this.order_by_array);
       this._clear_array(this.group_by_array);
       this._clear_array(this.having_array);
       this._clear_array(this.limit_to);
       this._clear_array(this.offset_val);
       this._clear_array(this.join_clause);
       this._clear_array(this.distinct_clause);
       this._clear_array(this.aliased_tables);
       this._clear_array(this.returning_ids);

       this._clear_array(this.last_query_string);
       if (typeof new_last_query === 'string') {
           this.last_query_string.push(new_last_query);
       }
   }

   where(key, value=null, escape=true) {
       if (Object.prototype.toString.call(key) === Object.prototype.toString.call({}) && typeof value === 'boolean') {
           escape = value;
       }

       escape = (typeof escape === 'boolean' ? escape : true);

       if (typeof key === 'string' && Array.isArray(value) && value.length > 0) {
           return this._where_in(key, value, false, 'AND ');
       }
       return this._where(key, value, 'AND ', escape);
   }

   or_where(key, value=null, escape=true) {
       escape = (typeof escape === 'boolean' ? escape : true);

       if (typeof key === 'string' && typeof value === 'object' && Array.isArray(value) && value.length > 0) {
           return this._where_in(key, value, false, 'OR ');
       }
       return this._where(key, value, 'OR ', escape);
   }

   _where(key, value=null, type='AND ', escape=true) {
       escape = (typeof escape === 'boolean' ? escape : true);

       // If key is not an object....
       if (Object.prototype.toString.call(key) !== Object.prototype.toString.call({})) {
           // If it's not an object, it must be a string
           if (typeof key !== 'string') {
               throw new Error(`where(): If first parameter is not an object, it must be a string. ${typeof key} provided.`);
           } else {
               // If it is a string, it can't be an empty one
               if (key.length == 0) {
                   throw new Error("where(): No field name or query provided!");
               }
           }

           // If it's a actual where clause string (with no parantheses),
           // not just a field name, split it into individual parts to escape it properly
           if (/(<=|>=|<>|>|<|!=|=)/.test(key) && key.indexOf('(') === -1 && escape === true) {
               const filters = key.split(/\s+(AND|OR)\s+/i);
               if (filters.length > 1) {
                   const self = this;
                   const parse_statement = (statement, joiner) => {
                       const parsed = statement.match(/^([^<>=!]+)(<=|>=|<>|>|<|!=|=)(.*)$/);
                       if (parsed.length >= 4) {
                           const key = parsed[1].trim() + (parsed[2].trim() !== '=' ? ' ' + parsed[2].trim() : '');
                           const value = parsed[3].trim().replace(/^((?:'|"){1})(.*)/, "$2").replace(/'$/,'');
                           if (joiner === null || /AND/i.test(joiner)) {
                               self.where(key, value, true);
                           } else {
                               self.or_where(key, value, true);
                           }
                       }
                   };
                   parse_statement(filters.shift(), null);
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

       // Fail if its an empty object
       if (Object.keys(key).length === 0) {
           throw new Error("where(): You haven't provided any key value pairs to limit the resultset by.");
       }

       // If an object is supplied...
       for (let k in key) {
           let v = key[k];

           if (Array.isArray(v) && v.length > 0) {
               this._where_in(k, v, false, type, escape);
               continue;
           }

           const prefix = (this.where_array.length == 0 ? '' : type);

           if (v === null && !this._has_operator(k)) {
               k += ' IS NULL';
           }

           if (v !== null) {
               if (escape === true) {
                   k = this._protect_identifiers(k, false, escape);
                   v = ' ' + this._qb_escape(v);
               }

               if (escape !== true && Object.prototype.toString.call(key) === Object.prototype.toString.call({})) {
                   v = ' ' + this._qb_escape(v);
               }

               if (!this._has_operator(k)) {
                   k += ' =';
               }
           }
           else {
               k = this._protect_identifiers(k, false, escape);
           }

           if (v) {
               this.where_array.push(prefix+k+v);
           }
           else {
               this.where_array.push(prefix+k);
           }
       }

       return this;
   }

   where_in(key, values, escape=true) {
       return this._where_in(key, values, false, 'AND ', escape);
   }

   or_where_in(key, values, escape=true) {
       return this._where_in(key, values, false, 'OR ', escape);
   }

   where_not_in(key, values, escape=true) {
       return this._where_in(key, values, true, 'AND ', escape);
   }

   or_where_not_in(key, values, escape=true) {
       return this._where_in(key, values, true, 'OR ', escape);
   }

   _where_in(key='', values=[], not, type='AND ', escape=true) {
       not = (not ? ' NOT' : '');
       escape = (typeof escape === 'boolean' ? escape : true);

       if (typeof key !== 'string' || (typeof key === 'string' && key.length == 0)) {
           throw new Error("where_" + (not === '' ? '' : not.toLowerCase() + '_') + "in(): Invalid field name provided.");
       }

       // `values` must be an array...
       if (!Array.isArray(values)) {
           throw new Error("where_" + (not === '' ? '' : not.toLowerCase() + '_') + "in(): Invalid second parameter provided--it must be an array of scalar values or an empty array.");
       }

       // If array is empty, ignore this request
       else if (values.length === 0) return;

       for (let i in values) {
           this.where_in_array.push(this._qb_escape(values[i]));
       }

       const prefix = (this.where_array.length === 0 ? '' : type);
       const where_in = prefix + this._protect_identifiers(key, false, escape) + not + " IN (" + this.where_in_array.join(', ') + ")";
       this.where_array.push(where_in);

       // reset the array for multiple calls
       this._clear_array(this.where_in_array);
       return this;
   }

   like(field, match, side) {
       return this._like(field, match, 'AND ', side, '');
   }

   not_like(field, match, side) {
       return this._like(field, match, 'AND ', side, ' NOT');
   }

   or_like(field, match, side) {
       return this._like(field, match, 'OR ', side, '');
   }

   or_not_like(field, match, side) {
       return this._like(field, match, 'OR ', side, ' NOT');
   }

   _like(field, match, type='AND ', side='both', not='') {
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

       for (let k in field) {
           let like_statement;
           let v = field[k];
           k = this._protect_identifiers(k.trim());

           // Make sure value is only string, number, or boolean
           if (!/^(string|number|boolean)$/.test(typeof v)) {
               throw new Error("like(): You have provided an invalid value as the second parameter. Only valid strings, numbers, and booleans are allowed.");
           }
           // If number, don't allow Infinity or NaN
           else if (typeof v === 'number' && (v === Infinity || (v !== +v))) {
               throw new Error("like(): You have provided an invalid number value as the second parameter. Only valid strings, numbers, and booleans are allowed.");
           }

           // Make sure to escape the value...
           v = this._qb_escape(v);

           if (side === 'none') {
               like_statement =  k + not + ` LIKE ${v}`;
           }
           else if (side === 'before' || side === 'left') {
               if (typeof v === 'string') {
                   like_statement = k + not + ` LIKE ${v.substr(0, 1)}%${v.substr(1)}`;
               } else {
                   like_statement = k + not + ` LIKE %${v}`;
               }
           }
           else if (side === 'after' || side === 'right') {
                if (typeof v === 'string') {
                    like_statement = k + not + ` LIKE ${v.substr(0, v.length -1)}%${v.slice(-1)}`;
                } else {
                    like_statement = k + not + ` LIKE ${v}%`;
                }
           }
           else if (side === 'both') {
               if (typeof v === 'string') {
                   like_statement = k + not + ` LIKE ${v.substr(0, 1)}%${v.substr(1, v.length -2)}%${v.slice(-1)}`;
               } else {
                   like_statement = k + not + ` LIKE %${v}%`;
               }
           }
           else {
               throw new Error("like(): Invalid direction provided!");
           }

           this._where(like_statement, null, type, false);
       }

       return this;
   }

   from(from_param) {
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

                   this._track_aliases(v);

                   this.from_array.push(this._protect_identifiers(v, false, true));
               }
           }
           else {
               val = val.trim();

               // Extract any aliases that might exist.  We use this information
               // in the protect_identifiers function to know whether to add a table prefix
               this._track_aliases(val);

               this.from_array.push(this._protect_identifiers(val, false, true));
           }
       }

       return this;
   }

   select(select, escape=true) {
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
               this.select_array.push(this._protect_identifiers(val, false, escape));
           }
       }
       return this;
   }

   select_min(select, alias) {
       return this._min_max_avg_sum(select, alias, 'MIN');
   }

   select_max(select, alias) {
       return this._min_max_avg_sum(select, alias, 'MAX');
   }

   select_avg(select, alias) {
       return this._min_max_avg_sum(select, alias, 'AVG');
   }

   select_sum(select, alias) {
       return this._min_max_avg_sum(select, alias, 'SUM');
   }

   _min_max_avg_sum(select='', alias='', type='MAX') {

       if (typeof select !== 'string' || select === '') {
           throw Error("Invalid query!");
           return this;
       }

       type = type.toUpperCase();

       if (['MAX', 'MIN', 'AVG', 'SUM'].indexOf(type) === -1) {
           throw Error("Invalid function type!");
           return this;
       }

       if (alias == '') {
           alias = this._create_aliases_from_table(select.trim());
       }

       const sql = `${type}(${this._protect_identifiers(select.trim())}) AS ${alias}`;

       this.select_array.push(sql);

       return this;
   }

   distinct(do_distinct) {
       do_distinct = (typeof do_distinct !== 'boolean' ? true : do_distinct);

       if (do_distinct) {
           this._clear_array(this.distinct_clause);
           this.distinct_clause.push('DISTINCT ');
       }
       else {
           this._clear_array(this.distinct_clause);
       }
       return this;
   }

   group_by(by) {
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
               this.group_by_array.push(this._protect_identifiers(val));
           }
       }
       return this;
   }

   having(key, value, escape=true) {
       escape = (typeof escape !== 'boolean' ? true : escape);
       return this._having(key, value, 'AND ', escape);
   }

   or_having(key, value, escape=true) {
       escape = (typeof escape !== 'boolean' ? true : escape);
       return this._having(key, value, 'OR ', escape);
   }

   _having(key, value, type='AND ', escape=true) {

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
                       key = this._extract_having_parts(key, key_array);
                   }
               }
               else if (key_is_array === true) {
                   //console.log("Key is NOT a string");
                   for (let i in key) {
                       if (typeof key[i] !== 'string') {
                           throw new Error("having(): You've provided an unparseable format to the having() method..");
                       }
                       else {
                           key_array = this._extract_having_parts(key[i], key_array);
                       }
                   }
                   key = key_array;
               }
           }
       }
       else {
           throw new Error(`Improper value supplied as the second parameter (${typeof value}) of the having() method.`);
       }


       for (let k in key) {
           let v = key[k];
           const prefix = (this.having_array.length == 0 ? '' : type);

           if (escape === true) {
               k = this._protect_identifiers(k);
           }

           if (v === null) {
               k += ' IS';
           }
           else if (!this._has_operator(k)) {
               k += ' =';
           }

           if (v != '') {
               v = ' ' + this._qb_escape(v);
           }

           this.having_array.push(prefix + k + v);
       }

       return this;
   }

   join(table='', relation='', direction='', escape=true) {
       if (typeof table !== 'string' || (typeof table === 'string' && table.trim().length === 0)) {
           throw new Error("You must provide a table, view, or stored procedure to join to!");
       }

       relation = (typeof relation === 'string' && relation.trim().length !== 0 ? relation.trim() : '');
       direction = (typeof direction === 'string' && direction.trim().length !== 0 ? direction.trim() : '');
       escape = (typeof escape === 'boolean' ? escape : true);

       const valid_directions = ['LEFT', 'RIGHT', 'OUTER', 'INNER', 'LEFT OUTER', 'RIGHT OUTER'];

       if (direction) {
           direction = direction.toUpperCase().trim();
           if (!valid_directions.includes(direction)) {
               throw new Error("Invalid join direction provided as third parameter.");
           }
           if (!relation) {
               throw new Error("You must provide a valid condition to join on when providing a join direction.");
           }
       }

       // Keep track of the table alias (if one is provided)
       this._track_aliases(table);

       // How to split a condition (foo=bar) into its consituent parts

       // Find all the conditions and protect their identifiers
       if (escape === true && this.multi_condition_rgx.test(relation)) {
           const new_relation = relation.split(this.multi_condition_rgx).map((v,i) => {
               if (i % 2 !== 0) return v.trim();
               const match = v.match(this.condition_rgx);
               if (!match) return v.trim();
               return `${this._protect_identifiers(match[1].trim(), false, escape)} ${match[2].trim()} ${this._protect_identifiers(match[3].trim(), false, escape)}`;
           }).join(' ');

           relation = `ON ${new_relation}`;
       }

       // Split apart the condition and protect the identifiers
       else if (relation && escape !== false && this.condition_rgx.test(relation)) {
           const match = relation.match(this.condition_rgx);
           relation = `ON ${this._protect_identifiers(match[1].trim(), false, escape)} ${match[2].trim()} ${this._protect_identifiers(match[3].trim(), false, escape)}`;
       }
       else if (relation && !this._has_operator(relation)) {
           relation = `USING (${(escape ? this._escape_identifiers(relation) : relation)})`;
       }
       else if (relation && escape === false) {
           relation = `ON ${relation}`;
       }
       else {
           relation = '';
       }

       // Do we want to escape the table name?
       if (escape === true) {
           table = this._protect_identifiers(table, false, true);
       }

       this.join_array.push(`${direction} JOIN ${table} ${relation}`.trim());
       return this;
   }

   order_by(orderby, direction) {
       let m;
       direction = (typeof direction === 'string' ? direction.toLowerCase().trim() : '');

       // Don't need to do anything below if the direction provided is random
       if ((direction === 'random' || direction === 'rand' || direction === 'rand()')) {
           this.order_by_array.push(this.rand_word);
           return this;
       }

       // Normalize orderby to be an array of items
       if (!Array.isArray(orderby)) {
           if (typeof orderby === 'string') {
               orderby = orderby.trim();
               if (orderby.length == 0) {
                   throw new Error("You haven't provided any fields to order by!!");
               }
               orderby = orderby.split(',');
           } else if (!orderby && (/(newid|random|RAND|RAND\(\))/i.test(direction))) {
               this.order_by_array.push(this.rand_word);
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

           if (m = orderby[i].match(/([^\s]+)\s+(ASC|DESC|RAND\(\)|NEWID\(\))/i)) {
               if (m[2].trim() === this.rand_word) {
                   this.order_by_array.push(this.rand_word);
                   return this;
               }
               orderby[i] = {field: this._protect_identifiers(m[1].trim()), direction: m[2].trim().toUpperCase()};
           } else {
               if (/^(ASC|DESC)$/i.test(direction) || direction === '') {
                   orderby[i] = {field: this._protect_identifiers(orderby[i].trim()), direction: (direction !== '' ? direction.toUpperCase() : 'ASC')};
               } else {
                   throw new Error("Invalid direction provided in order_by method! Only 'ASC', 'DESC', and 'RAND' are allowed!");
               }
           }

           this.order_by_array.push(orderby[i].field + ' ' + orderby[i].direction);
       }

       return this;
   }

   limit(limit, offset) {
       this._clear_array(this.limit_to);
       this.limit_to.push(this._prepare_for_limit_and_offset(limit, 'limit'));

       if (offset !== undefined) {
           return this.offset(offset);
       }

       return this;
   }

   offset(offset) {
       this._clear_array(this.offset_val);
       this.offset_val.push(this._prepare_for_limit_and_offset(offset, 'offset'));
       return this;
   }

   returning(ids) {
       // By default, this will do nothing. Specific drivers will override as needed.
       return this;
   }

   set(key, value, escape=true) {
       escape = (typeof escape === 'boolean' ? escape : true);

       if (typeof key === 'string') {
           // Convert key and value params to {key: value}
           key = key.trim();
           if (key.length == 0) throw new Error("set(): Invalid field name provided!");

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
           const escaped_key = this._protect_identifiers(i, false, escape);

           // Build a temporary object with escaped key and val
           const temp = {};
           if (escape === false) {
               temp[escaped_key] = v;
           } else {
               temp[escaped_key] = this._qb_escape(v);
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
   }


   // ---------------------------- SQL EXEC TOOLS ----------------------------//
   insert(table='', set='', ignore=false, suffix='') {
       return this._insert(table, set, ignore, suffix);
   }

   _insert(table='', set='', ignore=false, suffix='') {
       table = table || ''; // force falsy values to be an empty string
       ignore = (typeof ignore !== 'boolean' ? false : ignore);
       suffix = (typeof suffix !== 'string' ? '' : suffix);

       if (/^(number|boolean)$/.test(typeof set) || (typeof set == 'string' && set !== '') || Object.prototype.toString.call(set) === Object.prototype.toString.call(/test/)) {
           throw new Error("insert(): Invalid data provided to insert into database!");
       }
       if (Array.isArray(set)) {
           return this._insert_batch(table, set, ignore, suffix);
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
           if (this.from_array.length == 0) throw new Error('insert(): No tables set to insert into!');
           table = this.from_array[0];
       } else {
           this._clear_array(this.from_array);
           this.from(table);
       }
       return this._compile_insert(ignore, suffix);
   }

   insert_ignore(table, set, suffix) {
       return this._insert_ignore(table, set, suffix);
   }

   _insert_ignore(table, set, suffix) {
       return this.insert(table, set, true, suffix);
   }

   insert_batch(table, set=null, ignore, suffix) {
       return this._insert_batch(table, set, ignore, suffix);
   }

   get(table) {
       return this._get(table);
   }

   _get(table) {
       if (typeof table === 'string' || Array.isArray(table)) {
           this.from(table);
       }
       else {
           if (this.from_array.length === 0) {
               throw new Error('You have not specified any tables to select from!');
           }
       }
       return this._compile_select();
   }

   get_where(table=null, where=null) {
       return this._get_where(table, where);
   }

   _get_where(table=null, where=null) {
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

       return this._compile_select();
   }

   count(table) {
       return this._count(table);
   }

   update(table, set, where=null) {
       return this._update(table, set, where);
   }

   _update(table='', set=null, where=null) {
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
           this._clear_array(this.from_array);
           this.from(table);
       }

       // Set where array if a where statement was provided
       if (where !== null) {
           this.where(where);
       }

       return this._compile_update();
   }

   update_batch(table='', set=null, index=null, where=null) {
       return this._update_batch(table, set, index, where);
   }

   delete(table, where) {
       return this._delete(table, where);
   }

   _delete(table, where) {
       if (typeof table == 'string' && table.trim().length > 0) {
           this._clear_array(this.from_array);
           this.from(table);
       }

       if (Object.prototype.toString.call(where) === Object.prototype.toString.call({}) && where !== null) {
           if (Object.keys(where).length === 0) {
               throw new Error("where(): The object you provided to limit the deletion of rows is empty. Provide NULL if you need to an empty value.");
           }
           else {
               this.where(where);
           }
       }

       return this._compile_delete();
   }

   get_compiled_select(table) {
       if (typeof table !== 'undefined') {
           this._track_aliases(table);
           this.from(table);
       }
       else {
           if (this.from_array.length == 0) {
               throw new Error('You have not specified any tables to build a select statement with!');
               return this;
           }
       }

       return this._compile_select();
   }

   get_compiled_delete(table) {
       if (typeof table !== 'function') {
           this._track_aliases(table);
           this.from(table);
       }

       return this._compile_delete();
   }

   get_compiled_update(table) {
       if (typeof table !== 'function') {
           this._track_aliases(table);
           this.from(table);
       }
       return this._compile_update();
   }

   get_compiled_insert(table) {
       if (typeof table !== 'function') {
           this._track_aliases(table);
           this.from(table);
       }
       return this._compile_insert();
   }

   compile_select(table) {
       return this.get_compiled_select(table);
   }

   compile_delete(table) {
       return this.get_compiled_delete(table);
   }

   compile_update(table) {
       return this.get_compiled_update(table);
   }

   compile_insert(table) {
       return this.get_compiled_insert(table);
   }

   last_query() {
       return this.last_query_string[0] || '';
   }

   escape(val) {
       return this._qb_escape(val);
   }

   empty_table(table) {
       return this._empty_table(table);
   }

   _empty_table(table) {
       if (typeof table === 'string' && table.trim().length > 0) {
           this._clear_array(this.from_array);
           this.from(table);
       }

       if (this.from_array.length === 0) {
           throw new Error('empty_table(): You have not specified a table to empty!');
           return '';
       }

       return "DELETE FROM " + this.from_array[0];
   }

   truncate(table) {
       return this._truncate(table);
   }

   _truncate(table) {
       if (typeof table === 'string' && table.trim().length > 0) {
           this._clear_array(this.from_array);
           this.from(table);
       }

       if (this.from_array.length === 0) {
           throw new Error('truncate(): You have not specified a table to truncate!');
           return '';
       }

       return "TRUNCATE " + this.from_array[0];
   }

   _update_batch(table='', set=null, index=null, where=null) {
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
                       clean[this._protect_identifiers(j)] = this._qb_escape(row[j]);
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
           this._clear_array(this.from_array);
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
           const where = (this.where_array.length > 0 ? this._build_where_clause() + ' AND ' : '');
           const chunk = this.set_array.slice(i,100);

           // Escape the index
           index = this._protect_identifiers(index);

           for (let j in chunk) {
               ids.push(chunk[j][index]);

               const keys = Object.keys(chunk[j]);
               for (let k in keys) {
                   if (keys[k] != index) {
                       if (!when_then.hasOwnProperty(keys[k])) {
                           when_then[keys[k]] = [];
                       }
                       when_then[keys[k]].push(`WHEN ${index} = ${ids[j]} THEN ${chunk[j][keys[k]]} `);
                   }
               }
           }

           // Build the actual SQL statement
           let sql = `UPDATE (${table}) SET `;
           let cases = '';

           for (let l in when_then) {
               cases += l + ' = CASE ';

               for (let m in when_then[l]) {
                   cases += when_then[l][m];
               }

               cases += `ELSE ${l} END, `;
           }

           // Remove the trailing comma
           sql += cases.substr(0, cases.length - 2);

           // Make sure we don't double-up on the "WHERE" directive
           if (where) {
               sql += ` ${where}`;
           } else {
               sql += ' WHERE ';
           }


           sql += `${index} IN (${ids.join(',')})`;

           // Add query to batch
           batches.push(sql);
       }

       return batches;
   }
}

module.exports = GenericQueryBuilder;
