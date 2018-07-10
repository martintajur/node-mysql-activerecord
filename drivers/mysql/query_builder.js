const GenericQueryBuilder = require('../query_builder.js');

class QueryBuilder extends GenericQueryBuilder {
    constructor() {
        super();
        this.rand_word = 'RAND()';
    }

    // ---------------------------------------- SQL ESCAPE FUNCTIONS ------------------------ //
    _escape_identifiers(item = '*') {
        if (item === '*') return item;

        if (Object.prototype.toString.call(item) === Object.prototype.toString.call({})) {
            for (let i in item) {
                item[i] = this._escape_identifiers(item[i]);
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

    _protect_identifiers(item, protect_identifiers) {
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
        item = item.replace(/\s+/g, ' ');

        // This is basically a bug fix for queries that use MAX, MIN, subqueries, etc.
        // If a parenthesis is found we know that we do not need to
        // escape the data or add a prefix.
        if (item.indexOf('(') !== -1 || item.indexOf("'") !== -1) {
            const has_alias = item.lastIndexOf(')');
            let alias;
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

        let alias = '';

        // If the item has an alias declaration we remove it and set it aside.
        // Basically we remove everything to the right of the first space
        if (/\sAS\s/ig.test(item)) {
            const alias_index = item.indexOf(item.match(/\sAS\s/ig)[0]);
            alias = (protect_identifiers ? item.substr(alias_index, 4) + this._escape_identifiers(item.slice(alias_index + 4)) : item.substr(alias_index));
            item = item.substr(0, alias_index);
        }
        else if (item.indexOf(' ') !== -1) {
            const alias_index = item.indexOf(' ');

            alias = (protect_identifiers && ! this._has_operator(item.substr(alias_index + 1)) ? ' ' + this._escape_identifiers(item.substr(alias_index + 1)) : item.substr(alias_index));
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
            if (this.aliased_tables.indexOf(first_seg) !== -1) {
                if (protect_identifiers === true) {
                    for (let key in parts) {
                        const val = parts[key];
                        if (val !== '*') {
                            parts[key] = this._escape_identifiers(val);
                        }
                    }

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

        return item + alias;
    };

    _qb_escape(str) {
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
    _build_limit_clause(sql, limit, offset) {
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

    _compile_delete() {
        if (this.from_array.length === 0) {
            throw new Error('You have not specified any tables to delete from!');
            return '';
        }

        this.from_array = this.from_array.slice(0,1);

        const limit_to = this.limit_to[0] || false;
        const offset_val = this.offset_val[0] || false;

        const sql = 'DELETE' + this._build_from_clause() + this._build_where_clause();
        return this._build_limit_clause(sql, limit_to, offset_val);
    };

    _compile_insert(ignore, suffix='') {
        const keys = [];
        const values = [];

        for (let i in this.set_array) {
            const key = Object.keys(this.set_array[i])[0];
            const val = this.set_array[i][key];

            keys.push(key);
            values.push(val);
        }

        const verb = 'INSERT ' + (ignore === true ? 'IGNORE ' : '');

        if (this.from_array.length === 1) {
            const table = this.from_array.toString();
        } else {
            if (this.from_array.length === 0) {
                throw new Error("You haven't provided any tables to build INSERT querty with!");
                return '';
            }
            throw new Error("You have provided too many tables to build INSERT query with!");
            return '';
        }

        return verb + `INTO ${this.from_array[0]} (${keys.join(', ')}) VALUES (${values.join(', ')})${suffix}`;
    };

    _compile_select() {
        const distinct_clause = this.distinct_clause[0] || '';
        let sql = 'SELECT ' + distinct_clause;
        if (this.select_array.length === 0) {
            sql += '*';
        } else {
            sql += this.select_array.join(', ');
        }

        sql += this._build_from_clause()
            + this._build_join_string()
            + this._build_where_clause()
            + this._build_group_by_clause()
            + this._build_having_clause()
            + this._build_order_by_clause();

        const limit_to = this.limit_to[0] || false;
        const offset_val = this.offset_val[0] || false;

        sql = this._build_limit_clause(sql, limit_to, offset_val);
        return sql;
    };

    _compile_update() {
        const valstr = [];
        for (let i in this.set_array) {
            const key = Object.keys(this.set_array[i])[0];
            const val = this.set_array[i][key];
            valstr.push(key + ' = ' + val);
        }

        if (this.from_array.length !== 1) {
            if (this.from_array.length === 0) {
                throw new Error("You haven't provided any tables to build UPDATE query with!");
                return '';
            }
            throw new Error("You have provided too many tables to build UPDATE query with!");
            return '';
        }

        const table = this.from_array.toString();

        const limit_to = this.limit_to[0] || false;
        const offset_val = this.offset_val[0] || false;

        let sql = `UPDATE (${table}) SET ${valstr.join(', ')}`;
        sql += this._build_where_clause();
        sql += this._build_order_by_clause();
        return this._build_limit_clause(sql, limit_to, offset_val);
    };

    join(table, relation, direction, escape) {
        if (typeof table !== 'string' || table.trim().length == 0) {
            throw new Error("You must provide a table, view, or stored procedure to join to!");
        }

        relation = (typeof relation === 'string' && relation.trim().length != 0 ? relation.trim() : '');
        direction = (typeof direction === 'string' && direction.trim().length != 0 ? direction.trim() : '');
        escape = (typeof escape === 'boolean' ? escape : true);

        const valid_directions = ['LEFT', 'RIGHT', 'OUTER', 'INNER', 'LEFT OUTER', 'RIGHT OUTER'];

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

        this._track_aliases(table);

        // Split multiple conditions
        const regex = /\sAND\s|\sOR\s/ig;
        const m = relation.match(regex);
        const matches = [];
        let k, temp, temp_match, match;
        if (escape === true && m) {
            while (k = regex.exec(relation)) {
                matches.push(k);
            }

            let new_relation = '';
            matches.push(['']);
            matches[(matches.length - 1)].index = relation.length;
            for (let j = 0, c = matches.length, s = 0; j < c; s = matches[j].index + matches[j][0].length, j++) {
                temp = relation.substr(s, matches[j].index - s);
                temp_match = temp.match(/([\[\]\w\.'-]+)(\s*[^\"\[`'\w]+\s*)(.+)/i);
                new_relation += (temp_match ? this._protect_identifiers(temp_match[1], escape) + temp_match[2] + this._protect_identifiers(temp_match[3], escape) : temp);
                new_relation += matches[j][0];
            }

            relation = ' ON ' + new_relation;
        }

        // Split apart the condition and protect the identifiers
        else if (escape === true && /([\[\]\w\.'-]+)(\s*[^\"\[`'\w]+\s*)(.+)/i.test(relation)) {
            match = relation.match(/([\[\]\w\.'-]+)(\s*[^\"\[`'\w]+\s*)(.+)/i)
            relation = ' ON ' + this._protect_identifiers(match[1], true) + match[2] + this._protect_identifiers(match[3], true);
        }
        else if (!this._has_operator(relation)) {
            relation = ' USING (' + (escape ? this._escape_identifiers(relation) : relation) + ')';
        }
        else if (relation && escape === false) {
            relation = ' ON ' + relation;
        }
        else {
            relation = ' ';
        }

        // Do we want to escape the table name?
        if (escape === true) {
            table = this._protect_identifiers(table,true);
        }

        const join = direction + 'JOIN ' + table + relation;

        this.join_array.push(join);
        return this;
    }

    _insert_batch(table,set=null,ignore,suffix) {
        const orig_table = table = table || '';
        ignore = (typeof ignore !== 'boolean' ? false : ignore);
        suffix = (typeof suffix !== 'string' ? '' : ' ' + suffix);
        if (suffix == ' ') suffix = '';

        if (typeof table !== 'string') throw new Error("insert(): Table parameter must be a string!");
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
            this._clear_array(this.from_array);
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
                    columns.push(this._protect_identifiers(key));
                }
            }
        }

        for (let i = 0; i < set.length; i++) {
            (i => {
                const row = [];
                for (let key in set[i]) {
                    if (set[i].hasOwnProperty(key)) {
                        row.push(this._qb_escape(set[i][key]));
                    }
                }
                if (row.length != columns.length) {
                    throw new Error(`insert_batch(): Cannot use batch insert into ${table} - fields must match on all rows (${row.join(',')} vs ${columns.join(',')}).`);
                }
                map.push('(' + row.join(', ') + ')');
            })(i);
        }

        const verb = 'INSERT ' + (ignore === true ? 'IGNORE ' : '');
        return verb + `INTO ${this.from_array[0]} (${columns.join(', ')}) VALUES ${map.join(', ')}${suffix}`;
    }

    _count(table) {
        if (typeof table === 'string') {
            this.from(table);
        }

        const sql = 'SELECT COUNT(*) AS ' + this._protect_identifiers('numrows')
            + this._build_from_clause()
            + this._build_join_string()
            + this._build_where_clause();

        return sql;
    }
}

module.exports = QueryBuilder;
