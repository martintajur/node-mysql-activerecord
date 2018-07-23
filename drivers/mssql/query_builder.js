const GenericQueryBuilder = require('../query_builder.js');
const tsqlstring = require('tsqlstring');

class QueryBuilder extends GenericQueryBuilder {
    constructor() {
        super();
        this.rand_word = 'NEWID()';
        this.escape_char = ['[',']'];
        this.condition_rgx = /([\[\]\w\."\s-]+)(\s*[^\"\[`'\w-]+\s*)(.+)/i;
        this.multi_condition_rgx = /\s(OR|AND)\s/i;
    }

    // ---------------------------------------- SQL ESCAPE FUNCTIONS ------------------------ //

    _qb_escape(str) {
        if (typeof str === 'boolean') {
            str = (str === false ? 0 : 1);
        } else if (typeof str === 'number' || (typeof str === 'string' && /^\d+$/.test(str) && !/^0+/.test(str))) {
            str *= 1;
        } else {
            str = tsqlstring.escape(str);
        }

        return str;
    }

    // ---------------------------- SQL BUILD TOOLS ----------------------------//
    _build_limit_clause() {
        const limit_to = this.limit_to[0] || false;
        const offset_val = this.offset_val[0] || false;

        // If there's no limit provided or there IS an offset
        // provided, skip building limit clause
        if (!limit_to || offset_val) return '';

        return `TOP (${limit_to})`;
    }

    _build_offset_clause() {
        const limit_to = this.limit_to[0] || false;
        const offset_val = this.offset_val[0] || false;

        let offset_clause = '';

        // No offset provided
        if (!offset_val) return offset_clause;

        // There has to be an order by clause. This is a default.
        if (this.order_by_array.length === 0) {
            offset_clause += ' ORDER BY (SELECT NULL)';
        }

        offset_clause += ` OFFSET ${offset_val} ROWS`;
        if (limit_to) offset_clause += ` FETCH NEXT ${limit_to} ROWS ONLY`;
        return offset_clause.trim();
    }

    returning(ids) {
        ids = ids || null;
        if (typeof ids !== 'string' && !Array.isArray(ids)) throw new Error("returning(): Only non-empty strings and arrays of strings are allowed as column names.");
        if (Array.isArray(ids) && ids.length === 0) throw new Error("returning(): No columns specified in your array.");
        if (typeof ids === 'string' && ids.length <= 0) throw new Error("returning(): An empty string is not a valid column name.");

        if (typeof ids === 'string') {
            this.returning_ids.push(`INSERTED.${this._escape_identifiers(ids)}`);
        }

        else if (Array.isArray(ids)) {
            // Escape each ID
            ids = ids.map(v => `INSERTED.${this._escape_identifiers(v)}`);
            // Add new IDs without duplicating
            this.returning_ids = Array.from(new Set(this.returning_ids.concat(ids)));
        }

        return this;
    }

    _build_returning_clause() {
        if (this.returning_ids.length <= 0) return '';
        let sql = `OUTPUT ${this.returning_ids.join(', ')}`;
        return sql.trim();
    }

    // ---------------------------- SQL EXEC TOOLS ----------------------------//
    _compile_delete() {
        if (this.from_array.length === 0) {
            throw new Error('You have not specified any tables to delete from!');
            return '';
        }

        // Make sure we're only deleting from one table
        this.from_array = this.from_array.slice(0, 1);

        const limit_clause = this._build_limit_clause().trim();
        const offset_clause = this._build_offset_clause().trim();
        const from_clause = this._build_from_clause().trim();
        const where_clause = this._build_where_clause().trim();

        // Do not allow offset deletes (don't know how to do this yet)
        // TODO: implement this?
        if (offset_clause) throw new Error("Offset deletes are currently not supported by QueryBuilder for the `mssql` driver.");

        let sql = 'DELETE';
        sql += (limit_clause ? ` ${limit_clause}` : '');
        sql += ` ${from_clause}`;
        sql += (where_clause ? ` ${where_clause}` : '');

        return sql.trim();
    }

    _compile_insert(ignore=false, suffix='') {
        const keys = [];
        const values = [];

        for (let i in this.set_array) {
            const key = Object.keys(this.set_array[i])[0];
            const val = this.set_array[i][key];

            keys.push(key);
            values.push(val);
        }

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

        const returning_clause = this._build_returning_clause();

        let sql = `INSERT INTO ${this.from_array[0]} (${keys.join(', ')})`;
        sql += (returning_clause ? ` ${returning_clause}` : '');
        sql += ` VALUES (${values.join(', ')})`;
        return sql.trim();
    }

    _compile_select() {
        const distinct_clause = this.distinct_clause[0] || '';
        const from_clause = this._build_from_clause().trim();
        const join_string = this._build_join_string().trim();
        const where_clause = this._build_where_clause().trim();
        const group_by_clause = this._build_group_by_clause().trim();
        const having_clause = this._build_having_clause().trim();
        const order_by_clause = this._build_order_by_clause().trim();
        const offset_clause = this._build_offset_clause().trim();

        let sql = (`SELECT ${distinct_clause}`).trim() + ' ';

        const limit_clause = this._build_limit_clause();
        if (limit_clause) sql += `${limit_clause} `;

        if (this.select_array.length === 0) {
            sql += '*';
        } else {
            sql += this.select_array.join(', ');
        }

        sql = `${sql} ${from_clause}`;
        sql += (join_string ? ` ${join_string}` : '');
        sql += (where_clause ? ` ${where_clause}` : '');
        sql += (group_by_clause ? ` ${group_by_clause}` : '');
        sql += (having_clause ? ` ${having_clause}` : '');
        sql += (order_by_clause ? ` ${order_by_clause}` : '');
        sql += (offset_clause ? ` ${offset_clause}` : '');

        return sql.trim();
    }

    _compile_update() {
        const valstr = this.set_array.map((v,i) => {
            const key = Object.keys(v)[0];
            const val = v[key];
            return `${key} = ${val}`;
        }).join(', ');

        if (this.from_array.length !== 1) {
            if (this.from_array.length === 0) {
                throw new Error("You haven't provided any tables to build UPDATE query with!");
                return '';
            }
            throw new Error("You have provided too many tables to build UPDATE query with!");
            return '';
        }

        const limit_clause = this._build_limit_clause().trim();
        const order_by_clause = this._build_order_by_clause().trim();
        const where_clause = this._build_where_clause().trim();

        const table = this.from_array.toString();

        let sql = 'UPDATE ';

        if (!limit_clause) {
            sql += `${table} SET ${valstr} ${where_clause}`;
        } else {
            const from_clause = (limit_clause ? `` : `${limit_clause} * FROM ${table}`);
            sql += `[t] SET ${valstr} FROM (SELECT`;
                sql += (limit_clause ? ` ${limit_clause}` : '');
                sql += ` * FROM ${table}`;
                sql += (where_clause ? ` ${where_clause}` : '');
                sql += (order_by_clause ? ` ${order_by_clause}` : '');
                sql += `) [t]`;
        }

        return sql.trim();
    }

    insert(table='', set='', ignore=false, suffix='') {
        if (ignore) throw new Error("insert(): INSERT IGNORE is currently unsupported on the MSSQL driver.");
        if (suffix) throw new Error("insert(): 'on_dupe' string (4th parameter) is currently unsupported on the MSSQL driver.");
        return this._insert(table, set);
    }

    insert_batch(table, set=null, ignore=false, suffix='') {
        if (ignore) throw new Error("insert_batch(): INSERT IGNORE is currently unsupported on the MSSQL driver.");
        if (suffix) throw new Error("insert_batch(): 'on_dupe' string (4th parameter) is currently unsupported on the MSSQL driver.");
        return this._insert_batch(table, set);
    }

    _insert_batch(table='', set=null) {
        const orig_table = table = table || '';

        if (typeof table !== 'string') throw new Error("insert_batch(): Table parameter must be a string!");
        table = table.trim();

        if (table !== '' && !/^[a-zA-Z0-9\$_]+(\.[a-zA-Z0-9\$_]+)?$/.test(table)) {
            throw new Error(`insert_batch(): Invalid table name ('${table}') provided!`);
        }

        if (!table) {
            if (this.from_array.length === 0) throw new Error("insert_batch(): You have not set any tables to insert into.");
            if (this.from_array.length > 1) throw new Error("insert_batch(): Batch inserting into multiple tables is not supported.");
            table = this.from_array[0];
        } else {
            this._clear_array(this.from_array);
            this.from(table);
        }

        if (!Array.isArray(set)) {
            throw new Error('insert_batch(): Array of objects must be provided for batch insert!');
        }

        if (set.length === 0) {
            return this.insert(orig_table, {});
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
                        throw new Error("insert_batch(): Invalid value provided!");
                    }
                    else if (typeof v === 'number' && (v === Infinity || v !== +v)) {
                        throw new Error("insert_batch(): Infinity and NaN are not valid values in MS SQL!");
                    }
                }
            }
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
                map.push(`(${row.join(', ')})`);
            })(i);
        }

        const sql = `INSERT INTO ${this.from_array[0]} (${columns.join(', ')}) VALUES ${map.join(', ')}`;
        return sql.trim();
    }

    _count(table) {
        if (typeof table === 'string') {
            this.from(table);
        }

        const from_clause = this._build_from_clause().trim();
        const join_string = this._build_join_string().trim();
        const where_clause = this._build_where_clause().trim();

        let sql = `SELECT COUNT(*) AS ${this._protect_identifiers('numrows')} ${from_clause}`;
        sql += (join_string ? ` ${join_string}` : '');
        sql += (where_clause ? ` ${where_clause}` : '');

        return sql.trim();
    }
}

module.exports = QueryBuilder;
