[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Node.js Version][node-image]][node-url]
[![Build Status][travis-image]][travis-url]

# Universal QueryBuilder for Node.js
Node-QueryBuilder is an ambitious attempt to create a kind of "universal translator" which provides programmers a consistent API to connect to and query _any_ database (traditional and NoSQL) supported by the module. The module is highly extensible and, in theory, can suppport any database provided that the driver has been written for it.

The API of this module very closely mimics Codeigniter's Active Record (now called "Query Builder") library and much of the code has been directly translated from the PHP libraries in Codeigniter to JavaScript. A lot of credit needs to go to the folks over at EllisLab ([https://ellislab.com/codeigniter](https://ellislab.com/codeigniter)) and all the contributors to the Codeigniter project (of which I am one): [https://github.com/EllisLab/CodeIgniter/](https://github.com/EllisLab/CodeIgniter/)

The primary benefits of this module (currently) are:
- Ability to write queries agnostically to the database you intend to query
- Supports all basic database commands (insert, update, delete, select, etc...)
- Extend capabilities from the most popular native database drivers in NPM.
- Supports method chaining
- Automatically escapes field values and identifiers by default
- Is fully unit tested
- **Very thoroughly documented**
- Allows for greater flexibility and more control over a full ORM
- Lighter-weight than an ORM
- Allows you to drop down to the native methods of your driver if you choose to
- Allows for different drivers for different versions (SQLite 2 vs SQLite 3)
- The order in which you call the methods is irrelevant except for the execution methods (get, insert, update, delete) which must be called last.
- Can used as a learning tool/Rosetta stone

# Table of Contents
- [Database Drivers](#database-drivers)
- [How to Install](#how-to-install)
- [License Info](#license-info)
- [Quick Example](#quick-example)
- [Connecting to Your Database](#connecting-to-your-database)
  - [Quick Reference](#quick-reference)
  - [Standard Connection Settings](#standard-connection-settings)
  - [Choosing the Database Type](#choosing-the-database-type)
  - [Choosing the Connection Type](#choosing-the-connection-type)
  - [Managing Connections](#managing-connections)

- [API Methods](#api-methods)
  - [Chainable Methods](#chainable-methods)
  - [Execution Methods](#execution-methods)
    - [What Are Execution Methods?](#what-are-execution-methods)
    - [Handling Error Messages and Results](#handling-error-messages-and-results)
    - [Response Format Examples](#response-format-examples)
  - [Other Library-Specific Methods](#other-library-specific-methods)

- [Contribute](#contribute)

# Database Drivers
## Currently Written:
- MySQL / MariaDB
- Microsoft SQL Server

## Coming Soon:
- Postgres
- Oracle
- SQLite
- MongoDB

# How to install

```
npm install node-querybuilder
```

# License Info
Licensed under the GPL license and MIT:
- [http://www.opensource.org/licenses/GPL-license.php](http://www.opensource.org/licenses/GPL-license.php)
- [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)

# Quick Example
This quick example shows how to connect to and asynchronously query a MySQL database using a pooled connection.

```javascript
const QueryBuilder = require('node-querybuilder');
const settings = {
    host: 'localhost',
    database: 'mydatabase',
    user: 'myuser',
    password: 'MyP@ssw0rd'
};
const pool = new QueryBuilder(settings, 'mysql', 'pool');

pool.get_connection(qb => {
    qb.select('name', 'position')
        .where({type: 'rocky', 'diameter <': 12000})
        .get('planets', (err, response) => {
            qb.disconnect();

            if (err) return console.error("Uh oh! Couldn't get results: " + err.msg);

            // SELECT `name`, `position` FROM `planets` WHERE `type` = 'rocky' AND `diameter` < 12000
            console.log("Query Ran: " + qb.last_query());

            // [{name: 'Mercury', position: 1}, {name: 'Mars', position: 4}]
            console.log("Results:", response);
        }
    );
});
```

Anywhere a callback is used in the examples below, you can substitute for a Promise (or async/await). Here's the same code above in Promise format:

```javascript
const QueryBuilder = require('node-querybuilder');
const settings = {
    host: 'localhost',
    database: 'mydatabase',
    user: 'myuser',
    password: 'MyP@ssw0rd'
};
const pool = new QueryBuilder(settings, 'mysql', 'pool');

async function getPlanets() {
    try {
        const qb = await pool.get_connection();
        const response = await qb.select('name', 'position')
            .where({type: 'rocky', 'diameter <': 12000})
            .get('planets');

        // SELECT `name`, `position` FROM `planets` WHERE `type` = 'rocky' AND `diameter` < 12000
        console.log("Query Ran: " + qb.last_query());

        // [{name: 'Mercury', position: 1}, {name: 'Mars', position: 4}]
        console.log("Results:", response);
    } catch (err) {
        return console.error("Uh oh! Couldn't get results: " + err.msg);
    } finally {
        qb.disconnect();
    }
}

getPlanets();
```

# Connecting to Your Database
## Quick Reference

Driver                                     | Default  | Ready   | single | pool | cluster | Additional Connection Options
:----------------------------------------- | :------- | :------ | :----- | :--- | :------ | :----------------------------------------------------------------------------------------
[mysql](//www.npmjs.com/package/mysql)     | &#x2713; | Yes     | Yes    | Yes  | Pending | [node-mysql connection options](https://github.com/felixge/node-mysql#connection-options)
[mssql](//www.npmjs.com/package/tedious)   |          | Yes     | Yes    | Yes  | ???     | [tedious connection options](http://tediousjs.github.io/tedious/api-connection.html)
[sqlite3](//www.npmjs.com/package/sqlite3) |          | No      | Yes    | ???  | ???     |
[oracle](//www.npmjs.com/package/oracle)   |          | No      | Yes    | ???  | ???     |
[postgres](//www.npmjs.com/package/pg)     |          | No      | Yes    | Yes  | ???     |
[mongodb](//www.npmjs.com/package/mongodb) |          | No      | Yes    | ???  | ???     |

## Standard Connection Settings
The options listed below are available for all database drivers. Additional properties may be passed if the driver of the database you are connecting to supports them. See the "Additional Connection Options" column above for a link to the a specific driver's connection options documentation.

Option              | Default   | Optional | Description
:------------------ | :-------- | :------- | :-------------------------------------------
**host**            | localhost | No       | The server you're connecting to
**user**            | NULL      | No       | The database user
**password**        | NULL      | Yes      | The database `user`'s password
**database**        | NULL      | Yes      | The database to connect to
**port**            | NULL      | Yes      | The database port to use when connecting
**pool_size**       | 10        | Yes      | Max connections for `pool` connection type
**pool_min**        | 10        | Yes      | Min connections for `pool` connection type (`mssql` only)
**acquireTimeout**  | 10000     | Yes      | The milliseconds before a timeout occurs during the connection acquisition.
**debug**           | false     | Yes      | If true, debug info will be place in app log
**version**         | default   | Yes      | Version of database driver to use

The best way to store these options is in a JSON file outsite of your web root where only root and the server user can access them.

**Example JSON File**

We'll call this `db.json`.

```javascript
{
    "host": "db.myserver.com",
    "user": "myusername",
    "password": "P@s$w0rD",
    "database": "myDB",
    "pool_size": 50
}
```

**Example App**

```javascript
const settings = require('db.json');
// Second and third parameters of the QueryBuilder method default to 'mysql' and 'standard', respectively
const qb = new require('node-querybuilder')(settings);
```

Of course you can also just have a normal javascript object directly within your code somwhere if you're honing your inner Chuck Norris:

**Chuck Norris App**

```javascript
const qb = new require('node-querybuilder')({
    host: 'db.myserver.com',
    user: 'myusername',
    password: 'P@s$w0rD',
    database: 'MyDB',
    pool_size: 50
});
```

## Choosing the Database Type
This part is super simple. Just pass which one you'd like to use as the second parameter to the constructor (`mysql` is the default):

**_Example:_**

```javascript
const qb = new require('node-querybuilder')(settings, 'mssql');
```

## Choosing the Connection Type
This library currently supports 3 connection methods:
- **_single_** (default)
  - This will use the driver's basic single connection capabilities. All connections to your app will use this single database connection. This is usually less than ideal for most web applications but might be quite suitable for command line scripts and the like.
  - **All drivers must have this connection type**.

- **_pool_**
  - This will utilize the driver's connection pooling capabilities if it is offered. Connection pooling allows your application to pull from a pool of connections that were created by the driver. Typically the connections will be handed out to requesting methods in a round-robin fashion. This is ideal for a web application.

- **_cluster_**
  - _NOTE: This feature is currently incomplete._
  - When you have a cluster of servers and you want to create pools of connections to different servers to help load balance your stack, using the `cluster` connection type can come in handy. This is ideal for high-traffic web sites and applications that utilize a farm of database servers as opposed to just one.

**Note:** You will specify the type of connection as the third parameter to the contructor

**Example:**

```javascript
const qb = new require('node-querybuilder')(settings, 'mysql', 'pool');
```

## Managing Connections

It's important to handle your connections properly. When not using a pool, for every connection you make, you'll need to disconnect it when you're done. If you're using a pool (or cluster), it's a similar concept... but you'll be _releasing_ the connection back to the pool so it can be used again later.

**Single Connection Example:**

```javascript
const qb = new require('node-querybuilder')(settings, 'mysql');

qb.get('planets', (err, response) => {
    // Disconnect right away unless you're going to use it again for subsequent query
    qb.disconnect();

    if (err) return console.error(err);
    return console.log("Results: ", response);
});
```

**Connection Pool Example:**

```javascript
const pool = new require('node-querybuilder')(settings, 'mysql', 'pool');

// Get a connection (aka a QueryBuilder instance) from the pool
pool.get_connection(qb => {
    qb.get('planets', (err, response) => {
        // Release right away unless you're going to use it again for subsequent query
        qb.release();

        if (err) return console.error(err);
        return console.log("Results: ", response);
    });
});
```

# API Methods
**_NOTE:_** The compatibility portions of these tables are subject to change as features and drivers are written!

## Chainable Methods
Chainable methods can be called as many times as you'd like in any order you like. The final query will not be built and executed until one of the [execution methods](#execution-methods), like `get()`,  are callled. As the name implies, the methods can be chained together indefinitely but this is not required. You definitely call them individually with the same effect at execution time.

API Method                            | SQL Command | MySQL    | MSSQL    | Oracle   | SQLite   | Postgres | Mongo
:------------------------------------ | :---------- | :------: | :------: | :------: | :------: | :------: | :------:
[select()](#select)                   | SELECT      | &#x2713; | &#x2713; |          |          |          |
[distinct()](#distinct)               | DISTINCT    | &#x2713; | &#x2713; |          |          |          |
[select_min()](#min)                  | MIN         | &#x2713; | &#x2713; |          |          |          |
[select_max()](#max)                  | MAX         | &#x2713; | &#x2713; |          |          |          |
[select_avg()](#avg)                  | AVG         | &#x2713; | &#x2713; |          |          |          |
[select_sum()](#sum)                  | SUM         | &#x2713; | &#x2713; |          |          |          |
[from()](#from)                       | FROM        | &#x2713; | &#x2713; |          |          |          |
[join()](#join)                       | JOIN        | &#x2713; | &#x2713; |          |          |          |
[where()](#where)                     | WHERE       | &#x2713; | &#x2713; |          |          |          |
[where_in()](#where_in)               | IN          | &#x2713; | &#x2713; |          |          |          |
[where_not_in()](#where_not_in)       | WHERE       | &#x2713; | &#x2713; |          |          |          |
[or_where()](#or_where)               | WHERE       | &#x2713; | &#x2713; |          |          |          |
[or_where_in()](#or_where_in)         | WHERE       | &#x2713; | &#x2713; |          |          |          |
[or_where_not_in()](#or_where_not_in) | WHERE       | &#x2713; | &#x2713; |          |          |          |
[like()](#like)                       | LIKE        | &#x2713; | &#x2713; |          |          |          |
[or_like()](#or_like)                 | LIKE        | &#x2713; | &#x2713; |          |          |          |
[or_not_like()](#or_not_like)         | LIKE        | &#x2713; | &#x2713; |          |          |          |
[not_like()](#not_like)               | LIKE        | &#x2713; | &#x2713; |          |          |          |
[group_by()](#group-by)               | GROUP BY    | &#x2713; | &#x2713; |          |          |          |
[having()](#having)                   | HAVING      | &#x2713; | &#x2713; |          |          |          |
[or_having()](#or_having)             | HAVING      | &#x2713; | &#x2713; |          |          |          |
[order_by()](#order-by)               | ORDER BY    | &#x2713; | &#x2713; |          |          |          |
[limit()](#limit)                     | LIMIT       | &#x2713; | &#x2713; |          |          |          |
[offset()](#offset)                   | OFFSET      | &#x2713; | &#x2713; |          |          |          |
[set()](#set)                         | SET         | &#x2713; | &#x2713; |          |          |          |
[returning()](#returning)             | OUTPUT      | &#x2717; | &#x2713; |          |          |          |

--------------------------------------------------------------------------------

### SELECT
#### .select(fields[,escape])
This method is used to specify the fields to pull into the resultset when running SELECT-like queries.

Parameter | Type         | Default  | Description
:-------- | :----------- | :------- | :--------------------------------------------
fields    | String/Array | Required | The fields in which to grab from the database
escape    | Boolean      | true     | TRUE: auto-escape fields; FALSE: don't escape

The fields provided to this method will be automatically escaped by the database driver. The `fields` parameter can be passed in 1 of 2 ways (field names will be trimmed in either scenario):

**_NOTE:_** If the select method is never called before an execution method is ran, `SELECT *` will be assumed.
- String with fields seperated by a comma:
  - `.select('foo, bar, baz')`

- Array of field names
  - `.select(['foo', 'bar', 'baz'])`

**Examples**

```javascript
// SELECT * FROM galaxies
qb.select('*').get('foo', (err, results) => {});

// Easier and same result:
qb.get('foo', (err, results) => {});

// Async/Await version:
const results = await qb.get('foo');

```

An array of field names:

```javascript
// SELECT `foo`, `bar`, `baz`
qb.select(['foo', 'bar', 'baz']);
```

You can chain the method together using different patterns if you want:

```javascript
// SELECT `foo`, `bar`, `baz`, `this`, `that`, `the_other`
qb.select(['foo', 'bar', 'baz']).select('this, that, the_other');
```

You can alias your field names and they will be escaped properly as well:

```javascript
// SELECT `foo` as `f`, `bar` as `b`, `baz` as `z`
qb.select(['foo as f', 'bar as b', 'baz as z']);
```

You can optionally choose not to have the driver auto-escape the fieldnames (dangerous, but useful if you a utilize function in your select statement, for instance):

```javascript
// SELECT CONCAT(first_name,' ',last_name) AS `full_name`
qb.select('CONCAT(first_name,' ',last_name) AS `full_name`', false);
```

In order to successfully use subqueries in your select statements, you *must* supply `false` to the second parameter. _Please, for custom clauses containing subqueries, make sure you escape everything properly!_ **_ALSO NOTE:_** with this method, there may be conflicts between database drivers!

```javascript
// (SELECT `name` FROM `planets` WHERE `id`=8675309) AS `planet_name`
qb.select('(SELECT `name` FROM `planets` WHERE `id`=8675309) AS `planet_name`', false);

```

**_NOTE:_** If you use this technique to add driver-specific functions, it may (and probably will) cause unexpected outcomes with other database drivers!

--------------------------------------------------------------------------------

### DISTINCT
#### .distinct()
This SQL command is used to prevent duplicate rows from being returned in the resultset at the database level. It should only be used when querying data (execution methods: `.get()` & `.get_where()`) (not inserting, updating or removing). If it's provided to another execution method, it will simply be ignored.

**_This method takes no parameters_**

**Example**

```javascript
// SELECT DISTINCT `id`, `name`, `description` FROM `users`
qb.distinct().select('id, name, description').get('users', callback);
```

--------------------------------------------------------------------------------

### MIN
#### .select_min(field[,alias])
This SQL command is used to find the minimum value for a specific field within a resultset.

Parameter | Type   | Default  | Description
:-------- | :----- | :------- | :------------------------------------
field     | String | Required | The field to get the minimum value of
alias     | String | NULL     | Optional alias to rename field

**Examples**

```javascript
// SELECT MIN(`age`) FROM `users`
qb.select_min('age').get('users', callback);
```

You can optionally include a second parameter to rename the resulting field

```javascript
// SELECT MIN(`age`) AS `min_age` FROM `users`
qb.select_min('age', 'min_age').get('users', callback);
```

--------------------------------------------------------------------------------

### MAX
#### .select_max(field[,alias])
This SQL command is used to find the maximum value for a specific field within a resultset.

Parameter | Type   | Default  | Description
:-------- | :----- | :------- | :------------------------------------
field     | String | Required | The field to get the maximum value of
alias     | String | NULL     | Optional alias to rename field

**Examples**

```javascript
// SELECT MAX(`age`) FROM `users`
qb.select_max('age').get('users', callback);
```

You can optionally include a second parameter to rename the resulting field

```javascript
// SELECT MAX(`age`) AS `max_age` FROM `users`
qb.select_max('age', 'max_age').get('users', callback);
```

--------------------------------------------------------------------------------

### AVG
#### .select_avg(field[,alias])
This SQL command is used to find the average value for a specific field within a resultset.

Parameter | Type   | Default  | Description
:-------- | :----- | :------- | :------------------------------------
field     | String | Required | The field to get the average value of
alias     | String | NULL     | Optional alias to rename field

**Examples**

```javascript
// SELECT AVG(`age`) FROM `users`
qb.select_avg('age').get('users', callback);
```

You can optionally include a second parameter to rename the resulting field

```javascript
// SELECT AVG(`age`) AS `avg_age` FROM `users`
qb.select_avg('age', 'avg_age').get('users', callback);
```

--------------------------------------------------------------------------------

### SUM
#### .select_sum(field[,alias])
This SQL command is used to find the minimum value for a specific field within a result set.

Parameter | Type   | Default  | Description
:-------- | :----- | :------- | :------------------------------------
field     | String | Required | The field to get the minimum value of
alias     | String | NULL     | Optional alias to rename field

**Examples**

```javascript
// SELECT SUM(`age`) FROM `users`
qb.select_sum('age').get('users', callback);
```

You can optionally include a second parameter to rename the resulting field

```javascript
// SELECT SUM(`age`) AS `sum_age` FROM `users`
qb.select_sum('age', 'sum_age').get('users', callback);
```

--------------------------------------------------------------------------------

### FROM
#### .from(tables)
This SQL command is used to determine which sources, available to the active connection, to obtain data from.

Parameter | Type         | Default  | Description
:-------- | :----------- | :------- | :------------------------------------------
tables    | String/Array | Required | Table(s), view(s), etc... to grab data from

You can provide tables, views, or any other valid source of data in a comma-separated list (string) or an array. When more than one data-source is provided when connected to a traditional RDMS, the tables will joined using a basic join. You can also `.from()` multiple times to get the same effect (the order in which they are called does not matter).

Aliases can be provided and they will be escaped properly.

**_NOTE:_** You can also pass table/view names into the `.get()` and `.get_where()` methods and forego this method entirely.

**Examples**

**_Basic_**

```javascript
// SELECT `id`, `name`, `description` FROM `users`
qb.select('id, name, description').from('users').get(callback);
```

**_Comma-Seperated_**

```javascript
// SELECT `u`.`id`, `u`.`name`, `u`.`description`, `g`.`name` AS `group_name`
// FROM (`users` `u`, `groups` `g`)
qb.select('u.id, u.name, u, description, g.name as group_name')
    .from('users u, groups g')
    .get(callback);
```

**_Array of Tables_**

```javascript
// SELECT `u`.`id`, `u`.`name`, `u`.`description`, `g`.`name` AS `group_name`
// FROM (`users` `u`, `groups` `g`)
qb.select('u.id, u.name, u, description, g.name as group_name')
    .from(['users u', 'groups g'])
    .get(callback);
```

**_Multiple From Calls_**

```javascript
// SELECT `u`.`id`, `u`.`name`, `u`.`description`, `g`.`name` AS `group_name`
// FROM (`users` `u`, `groups` `g`)
qb.from('groups g').select('u.id, u.name, u, description, g.name as group_name')
    .from('users u')
    .get(callback);
```

--------------------------------------------------------------------------------

### JOIN
#### .join(table, relation[,direction])
This SQL command is used query multiple tables related and connected by keys and get a single result set.

Parameter | Type    | Default  | Description
:-------- | :------ | :------- | :--------------------------------------------------
table     | String  | Required | The table or view to join to.
relation  | String  | Required | The "ON" statement that relates two tables together
direction | String  | "left"   | Direction of the join (see join types list below)
escape    | Boolean | true     | TRUE: Escape table name and conditions; FALSE: No escaping

**Join Types/Directions**
- left
- right
- outer
- inner
- left outer
- right outer

The table/view and the relationship of it to the main table/view (see: `.from()`) must be specified. The specific type of join defaults to "left" if none is specified (although it is recommended to always supply this value for readability). Multiple function calls can be made if you need several joins in one query. Aliases can (and should) be provided and they will be escaped properly.

**Warning about complex relationship clauses**
This library currently does not support complex/nested ON clauses passed to the `relation` (second) parameter. You can supply multiple statements as long as they are not nested within parentheses. If you need to use a complex relationship clause, please make sure to escape those parts manually and pass `false` to the `escape` (fourth) parameter. See examples below for more details.

If anyone would like to add this capability, please submit a pull request!

**Examples**

If no direction is specified, "left" will be used:

```javascript
// SELECT `u`.`id`, `u`.`name`, `t`.`name` AS `type_name`
// FROM `users` `u`
// LEFT JOIN `types` `t` ON `t`.`id`=`u`.`type_id`
qb.select('u.id, u.name, t.name as type_name').from('users u')
    .join('types t', 't.id=u.type_id')
    .get(callback);
```

You may specify a direction:

```javascript
// SELECT `u`.`id`, `u`.`name`, `t`.`name` AS `type_name`
// FROM `users` `u`
// RIGHT OUTER JOIN `types` `t` ON `t`.`id`=`u`.`type_id`
qb.select('u.id, u.name, t.name as type_name').from('users u')
    .join('types t', 't.id=u.type_id', 'right outer')
    .get(callback);
```

Multiple function calls can be made if you need several joins in one query:

```javascript
// SELECT `u`.`id`, `u`.`name`, `t`.`name`  AS `type`, `l`.`name` AS `location`
// FROM `users` `u`
// LEFT JOIN `types` `t` ON `t`.`id`=`u`.`type_id`
// LEFT JOIN `locations` `l` ON `l`.`id`=`u`.`location_id`
const select = ['u.id', 'u.name', 't.name as type', 'l.name as location'];
qb.select(select).from('users u')
    .join('types t', 't.id=u.type_id', 'right outer')
    .join('locations l', 'l.id=u.location_id', 'left')
    .get(callback);
```

If you have a very complex condition you can choose to forego escaping (not recommended unless
you know what you're doing). NOTE: Please make sure to escape values manually.

```javascript
// SELECT `u`.`id`, `u`.`name`, `t`.`name`  AS `type`
// FROM `users` `u`
// LEFT JOIN `user_meta` `um` ON
//   CASE
//     WHEN `u`.`id` = 4132 THEN `um`.`id` = `um`.`userId`
//     WHEN `u`.`name` = 4132 THEN `um`.`name` = `u`.`id`
const select = ['u.id', 'u.name', 'um.name as user_name'];
const user_data = req.body;
qb.select(select).from('users u')
    .join('`user_meta` `um`', 'CASE WHEN `u`.`id` = ' + user_data.id  + ' THEN `um`.`id` = `um`.`userId` WHEN `u`.`name` = ' + user_data.id + ' THEN `um`.`name` = `u`.`id`', 'right outer', false)
    .get(callback);
```

--------------------------------------------------------------------------------

### WHERE
This SQL command is used to limit the resultset based on filters.

Parameter     | Type          | Default  | Description
:------------ | :------------ | :------- | :------------------------------------------------------------
field/filters | String/Object | Required | A field name, a WHERE clause, or an object of key/value pairs
value         | Mixed         | N/A      | When the first parameter is a field name, this is the value
escape        | Boolean       | TRUE     | TRUE: Escape field names and values; FALSE: No escaping

#### .where(field[,value[,escape]])
This method can be called in many different ways depending on your style and the format of the data that you have at the time of calling it. For standard SQL, all clauses will be joined with 'AND'—if you need to join clauses by 'OR', please us `.or_where()`. By default, all values and field names passed to this function will be escaped automatically to produce safer queries. You can turn this off by passing **false** into the third parameter.

If a valid field name is passed in the first parameter, you can pass an array the second parameter and the call will be treated as a [.where_in()](#where_in).

**Examples**

If you just want to pass a single filter at a time:

```javascript
// SELECT `galaxy` FROM `universe` WHERE `planet_name` = 'Earth'
qb.select('galaxy').where('planet_name', 'Earth').get('universe', callback);
```

If you need more complex filtering using different operators (`<, >, <=, =>, !=, <>, etc...`), you can simply provide that operator along with the key in the first parameter. The '=' is assumed if a custom operator is not passed:

```javascript
// SELECT `planet` FROM `planets` WHERE `order` <= 3
qb.select('planet').where('order <=', 3).get('planets', callback);
```

You can conveniently pass an object of key:value pairs (which can also contain custom operators):

```javascript
// SELECT `planet` FROM `planets` WHERE `order` <= 3 AND `class` = 'M'
qb.select('planet').where({'order <=':3, class:'M'}).get('planets', callback);
```

You can construct complex WHERE clauses manually and they will be escaped properly as long as there are no parenthesis within it. _Please, for custom clauses containing subqueries, make sure you escape everything properly!_ **_ALSO NOTE:_** with this method, there may be conflicts between database drivers!

```javascript
// SELECT `planet` FROM `planets` WHERE `order` <= 3 AND `class` = 'M'
qb.select('planet').where("order <= 3 AND class = 'M'").get('planets', callback);
```

You can pass a non-empty array as a value and that portion will be treated as a call to `.where_in()`:

```javascript
// SELECT `star_system` FROM `star_systems`
// WHERE `planet_count` >= 4, `star` IN('Sun', 'Betelgeuse')
qb.select('star_system')
    .where({'planet_count >=': 4, star: ['Sun', 'Betelgeuse']})
    .get('star_systems', callback);
```

<a name="or_where"></a>

#### .or_where(field[,value[,escape]])
This method functions identically to [.where()](#where) except that it joins clauses with 'OR' instead of 'AND'.

```javascript
// SELECT `star_system` FROM `star_systems`
// WHERE `star` = 'Sun' OR `star` = 'Betelgeuse'
qb.select('star_system').where('star', 'Sun')
    .or_where('star', 'Betelgeuse')
    .get('star_systems', callback);
```

<a name="where_in"></a>

#### .where_in(field, values[,escape])
This will create a "WHERE IN" statement in traditional SQL which is useful when you're trying to find rows with fields matching many different values... It will be joined with existing "WHERE" statements with 'AND'.

```javascript
// SELECT `star_system` FROM `star_systems`
// WHERE `star` IN('Sun', 'Betelgeuse', 'Sirius', 'Vega', 'Alpha Centauri')
const stars = ['Sun', 'Betelgeuse', 'Sirius', 'Vega', 'Alpha Centauri'];
qb.select('star_system').where_in('star', stars).get('star_systems', callback);
```

<a name="or_where_in"></a>

#### .or_where_in(field, values[,escape])
Same as `.where_in()` except the clauses are joined by 'OR'.

```javascript
// SELECT `star_system` FROM `star_systems`
// WHERE `planet_count` = 4 OR `star` IN('Sun', 'Betelgeuse')
const stars = ['Sun', 'Betelgeuse'];
qb.select('star_system').where('planet_count', 4)
    .or_where_in('star', stars)
    .get('star_systems', callback);
```

<a name="where_not_in"></a>

#### .where_not_in(field, values[,escape])
Same as `.where_in()` except this generates a "WHERE NOT IN" statement. All clauses are joined with 'AND'.

```javascript
// SELECT `star_system` FROM `star_systems`
// WHERE `star` NOT IN('Sun', 'Betelgeuse', 'Sirius', 'Vega', 'Alpha Centauri')
const stars = ['Sun', 'Betelgeuse', 'Sirius', 'Vega', 'Alpha Centauri'];
qb.select('star_system').where_not_in('star', stars).get('star_systems', callback);
```

<a name="or_where_not_in"></a>

#### .or_where_not_in(field, values[,escape])
Same as `.where_not_in()` except that clauses are joined with 'OR'.

```javascript
// SELECT `star_system` FROM `star_systems`
// WHERE `star` NOT IN('Sun', 'Betelgeuse')
// OR `planet_count` NOT IN [2,4,6,8]
const stars = ['Sun', 'Betelgeuse'];
const planet_sizes = [2,4,6,8];
qb.select('star_system')
    .where_not_in('star', stars)
    .or_where_not_in('planet_size', planet_sizes)
    .get('star_systems', callback);
```

--------------------------------------------------------------------------------

### LIKE
This SQL command is used to find close matches where as the "WHERE" command is for precise matches. This is useful for doing searches.

Parameter     | Type          | Default  | Description
:------------ | :------------ | :------- | :-------------------------------------------------
field/filters | String/Object | Required | Field name or object of field/match pairs
value         | String/Number | Required | The value you want the field to closely match
side          | String        | 'both'   | before: '%value'; after: 'value%', both: '%value%'

**NOTE:** You can, alternatively, use `'right'` and `'left'` in place of `'before'` and '`after`' if you prefer.

#### .like(field, match[,side])
All fields are escaped automatically, no exceptions. Multiple calls will be joined together with 'AND'. You can also pass an object of field/match pairs. Wildcard sides are interchangeable between before/left and after/right--choose the one that makes the most sense to you (there are examples of each below).

**Examples**

By default, the match string will be wrapped on both sides with the wildcard (%):

```javascript
// SELECT `first_name` FROM `users` WHERE `first_name` LIKE '%mber%'
// Potential results: [{first_name: 'Kimberly'},{first_name: 'Amber'}]
qb.select('first_name').like('first_name', 'mber').get('users', callback);
```

You can specify a side to place the wildcard (%) on if you'd like (before/left, after/right, both):

```javascript
// SELECT `first_name` FROM `users` WHERE `first_name` LIKE '%mber'
// Potential results: [{first_name: 'Amber'}]
qb.select('first_name').like('first_name', 'mber', 'before').get('users', callback);

// SELECT `first_name` FROM `users` WHERE `first_name` LIKE 'Kim%'
// Potential results: [{first_name: 'Kim'},{first_name: 'Kimberly'}]
qb.select('first_name').like('first_name', 'Kim', 'right').get('users', callback);
```

You can also pass 'none' if you don't want to use the wildcard (%)

```javascript
// SELECT `first_name` FROM `users` WHERE `first_name` LIKE 'kim'
// Potential results: [{first_name: 'Kim'}]
qb.select('first_name').like('first_name', 'kim', 'none').get('users', callback);
```

If you'd like to have multiple like clauses, you can do that by calling like multiple times:

```javascript
// SELECT `first_name` FROM `users`
// WHERE `first_name` LIKE 'Kim%'
// AND `middle_name` LIKE '%lyt%'
// AND `last_name` LIKE '%arris'
qb.select('first_name')
    .like('first_name', 'Kim', 'right')
    .like('middle_name', 'lyt')
    .like('last_name', 'arris', 'left')
    .get('users', callback);
```

Or you can do it with an object of field/match pairs. If you want to pass a wildcard side, provide `null` as the second parameter and the side as the third. **Note**: All `match` values in an object will share the same wildcard side.

```javascript
// SELECT `first_name` FROM `users`
// WHERE `first_name` LIKE '%ly'
// AND `middle_name` LIKE '%the'
// AND `last_name` LIKE '%is'
qb.select('first_name')
    .like({first_name: 'ly', middle_name: 'the', last_name: 'is'}, null, 'before')
    .get('users', callback);
```

<a name="or_like"></a>

#### .or_like(field, match[,side])
This is exactly the same as the `.like()` method except that the clauses are joined by 'OR' not 'AND'.

**Example**

```javascript
// SELECT `first_name` FROM `users`
// WHERE `first_name` LIKE 'Kim%'
// OR `middle_name` LIKE '%lyt%'
// OR `last_name` LIKE '%arris'
qb.select('first_name')
    .or_like('first_name', 'Kim', 'right')
    .or_like('middle_name', 'lyt')
    .or_like('last_name', 'arris', 'left')
    .get('users', callback);
```

<a name="not_like"></a>

#### .not_like(field, match[,side])
This is exactly the same as the `.like()` method except that it creates "NOT LIKE" statements.

**Example**

```javascript
// SELECT `first_name` FROM `users`
// WHERE `first_name` NOT LIKE 'A%'
// AND `middle_name` NOT LIKE 'B%'
// AND `last_name` NOT LIKE 'C%'
qb.select('first_name')
    .not_like({first_name: 'A', middle_name: 'B', last_name: 'C'}, null, 'after')
    .get('users', callback);
```

<a name="or_not_like"></a>

#### .or_not_like(field, match[,side])
This is exactly the same as the `.not_like()` method except that the clauses are joined by 'OR' not 'AND'.

**Example**

```javascript
// SELECT `first_name` FROM `users`
// WHERE `first_name` NOT LIKE 'A%'
// OR `middle_name` NOT LIKE 'B%'
// OR `last_name` NOT LIKE 'C%'
qb.select('first_name')
    .or_not_like({first_name: 'A', middle_name: 'B', last_name: 'C'}, null, 'after')
    .get('users', callback);
```

--------------------------------------------------------------------------------

### GROUP BY
#### .group_by(fields)
This SQL command allows you to get the first (depending on ORDER) result of a group of results related by a shared value or values.

Parameter | Type          | Default  | Description
:-------- | :------------ | :------- | :---------------------------------
field(s)  | String/Object | Required | Field name or array of field names

**Examples**

Group by a single field:

```javascript
// SELECT * FROM `users` GROUP BY `department_id`
qb.group_by('department_id').get('users', callback);
```

Group by multiple fields:

```javascript
// SELECT * FROM `users` GROUP BY `department_id`, `position_id`
qb.group_by(['department_id', 'position_id']).get('users', callback);
```

--------------------------------------------------------------------------------

### HAVING
#### .having(field, value)
This SQL command is similar to the 'WHERE' command but is used when aggregate functions are used in the "SELECT" portion of the query.

Parameter     | Type          | Default  | Description
:------------ | :------------ | :------- | :-----------------------------------------------------
field/filters | String/Object | Required | Field name or object of field/value pairs to filter on
value         | Mixed         | NULL     | Value to filter by
escape        | Boolean       | true     | TRUE: Escape fields and values; FALSE: Don't escape.

This method works exactly the same way as the `.where()` method works with the exception of the fact that there is no 'HAVING' equivalent to 'WHERE IN'. See the [.where()](#where) documentation if you need additional information.

**Examples**

If you just want to add a single having clause:

```javascript
// SELECT COUNT(*) AS `num_planets` FROM `star_systems`
// GROUP BY `id`
// HAVING `num_planets` = 5
qb.group_by('id').having('num_planets', 5).count('star_systems', callback);
```

If you need more complex filtering using different operators (`<, >, <=, =>, !=, <>, etc...`), you can simply provide that operator along with the key in the first parameter. The '=' is assumed if a custom operator is not passed:

```javascript
// SELECT COUNT(*) AS `num_planets` FROM `star_systems`
// GROUP BY `id`
// HAVING `num_planets` > 5
qb.group_by('id').having('num_planets >', 5).count('star_systems', callback);
```

You can conveniently pass an object of key:value pairs (which can also contain custom operators):

```javascript
// SELECT COUNT(*) AS `num_planets` FROM `star_systems`
// GROUP BY `id`
// HAVING `num_planets` > 5
qb.group_by('id').having({'num_planets >': 5}).count('star_systems', callback);
```

You can construct complex WHERE clauses manually and they will be escaped properly. _Please, for custom clauses containing subqueries, make sure you escape everything properly!_ **_ALSO NOTE:_** with this method, there may be conflicts between database drivers!

```javascript
// SELECT COUNT(*) AS `num_planets` FROM `star_systems`
// GROUP BY `id`
// HAVING `num_planets` > (5+2)
qb.group_by('id').having("`num_planets` > (5+2)", null, false).count('star_systems', callback);
```

<a name="or_having"></a>

#### .or_having(field[,value[,escape]])
This method functions identically to [.having()](#having) except that it joins clauses with 'OR' instead of 'AND'.

```javascript
// SELECT SUM(planets) AS `num_planets`, SUM(moons) AS `num_moons` FROM `star_systems`
// GROUP BY `id`
// HAVING `num_planets` >= 5 OR `num_moons` <= 10
qb.group_by('id')
    .having('num_planets >=', 5)
    .or_having('num_moons <=', 10)
    .count('star_systems', callback);
```

--------------------------------------------------------------------------------

### ORDER BY
#### .order_by(field[,direction])
This SQL command is used to order the resultset by a field or fields in descending, ascending, or random order(s).

Parameter | Type         | Default  | Description
:-------- | :----------- | :------- | :----------------------------------------------------------------------
fields    | String/Array | Required | Field name or an array of field names, possibly with directions as well
direction | String       | 'asc'    | 'asc': Ascending; 'desc': Descending; 'rand'/'random'/'rand()': Random.

This is a very flexible method, offering a wide variety of ways you can call it. Variations include:
- Pass the field name and omit the direction
- Pass the field name and the direction as the first and second parameters, respectively (most common)
- Pass an array of fields to first parameter, direction to second parameter.
- Pass an array of fields + directions in first parameter and omit the second one.
- Pass an array of fields (+ directions for some to override second parameter) to first parameter, direction to second parameter.
- Pass a raw comma-separated string of field + directions in first parameter and omit the second one.

**Examples**

Pass the field name and omit the direction

```javascript
// SELECT * FROM `galaxies` ORDER BY `galaxy_name` ASC
qb.order_by('galaxy_name').get('galaxies', callback);
```

Random sort

```javascript
// (MySQL) SELECT * FROM `galaxies` ORDER BY RAND() ASC
// (MSSQL) SELECT * FROM `galaxies` ORDER BY NEWID() ASC
qb.order_by('random').get('galaxies', callback);
```

Pass the field name and the direction as the first and second parameters, respectively

```javascript
// SELECT * FROM `galaxies` ORDER BY `galaxy_name` DESC
qb.order_by('galaxy_name', 'desc').get('galaxies', callback);
```

Pass an array of fields to first parameter, direction to second parameter

```javascript
// SELECT * FROM `galaxies` ORDER BY `galaxy_name` DESC, `galaxy_size` DESC
qb.order_by(['galaxy_name', 'galaxy_size'],'desc').get('galaxies', callback);
```

Pass an array of fields + directions in first parameter and ommit the second one.

```javascript
// SELECT * FROM `galaxies` ORDER BY `galaxy_name` DESC, `galaxy_size` ASC
qb.order_by(['galaxy_name desc', 'galaxy_size asc']).get('galaxies', callback);
```

Pass an array of fields (+ directions for some to override second parameter) to first parameter, direction to second parameter

```javascript
// SELECT * FROM `galaxies` ORDER BY `galaxy_name` DESC, `galaxy_size` ASC
qb.order_by(['galaxy_name desc', 'galaxy_size'],'asc').get('galaxies', callback);
```

Pass a raw comma-separated string of field + directions in first parameter and omit the second one.

```javascript
// SELECT * FROM `galaxies` ORDER BY `galaxy_name` ASC, `galaxy_size` DESC
qb.order_by('galaxy_name asc, galaxy_size desc').get('galaxies', callback);
```

--------------------------------------------------------------------------------

### LIMIT
#### .limit(limit_to, offset)
This SQL command is used to limit a result set to a maximum number of results, regardless of the actual number of results that might be returned by a non-limited query.

Parameter | Type    | Default  | Description
:-------- | :------ | :------- | :-----------------------------------------------------
limit_to  | Integer | Required | The maximum number of results you want from the query
offset    | Integer | NULL     | Optional offset value (where to start before limiting)

**Example**

```javascript
// SELECT * FROM `users` LIMIT 5
qb.limit(5).get('users', callback);
```

You can provide an option offset value instead of calling [.offset()](#offset) separately:

```javascript
// SELECT * FROM `users` LIMIT 5, 5
qb.limit(5, 5).get('users', callback);
```

--------------------------------------------------------------------------------

### OFFSET
#### .offset(offset)
This SQL command is tell the "LIMIT" where to start grabbing data. If cannot be used without a limit having been set first.

Parameter | Type    | Default | Description
:-------- | :------ | :------ | :-----------------------------
offset    | Integer | NULL    | where to start before limiting

The practical uses of this method are probably miniscule since the `.limit()` method must be called in order to use it and the limit method provides a means by which to set the offset. In any case, the method is very simple: pass the result row index that you want to start from when limiting. This is most useful for pagination of search results and similar scenarios.

**Example**

```javascript
// SELECT * FROM `users` LIMIT 5, 25
qb.limit(5).offset(25).get('users', callback);
```

--------------------------------------------------------------------------------

### SET
#### .set(key[, value[, escape]])
This SQL is used to set values to fields when utilizing the `update`, and `insert` methods. More than likely, you will choose use the shorthand notation provided by the aforementioned methods, but, this can be handy in some cases.

Parameter | Type          | Default  | Description
:-------- | :------------ | :------- | :-----------------------------------------------------------------------------------------------------
key       | String/Object | Required | The key of field to be set or an object of key:value pairs
value     | Mixed         | NULL     | Required if `key` is a string. Pass NULL if `key` is an object and you'd like to use the 3rd parameter
escape    | String/Object | true     | If false, keys and values will not be escaped.

**Examples**

Basic single setting of a value

```javascript
// UPDATE `users` SET `birthday` = '2015-02-04'
qb.set('birthday','2015-02-04').update('users', callback);
```

Set multiple keys and values at once

```javascript
const birthday = new Date(1986, 7, 5, 8, 15, 23);
// UPDATE `users` SET `birthday` = '2015-02-04', `anniversary` = '2010-05-15'
qb.set({birthday: birthday, anniversary: '2010-05-15'}).update('users', callback);
```

--------------------------------------------------------------------------------

### RETURNING / OUTPUT
#### .returning(id)
This method is required for MSSQL when performing INSERT queries to get the IDs of the row(s) that were inserted. You should supply which column(s) should be returned by the INSERT query as the `insert_id` in the response object. If you need multiple values (compound primary key, for instance) you can supply an array of strings representing those columns. If you call this method while using the `mysql` driver, it will be ignored silently.

Parameter | Type          | Default  | Description
:-------- | :------------ | :------- | :-----------------------------------------------------------------------------------------------------
key       | String/Array  | Required | The ID or IDs used to identify the row that you're inserting

**How This Works**

Upon a successful `INSERT` query, you will be provided with a `result` object (see: [Response Format Examples](#response-format-examples)). I the `returning()` method is not called when using the MSSQL driver, the `insert_id` property of the result object will be `NULL`. This is not needed for the MySQL driver because its engine already supplies this info to the driver by default.

**Examples**

Basic single ID example

```javascript
// INSERT INTO [users] ([first_name], [last_name]) OUTPUT INSERTED.[id] VALUES ('John', 'Smith')
qb.returning('id').insert('users', {first_name: 'John', last_name: 'Smith'});
```

Return multiple column that should act as the `insert_id`

```javascript
// INSERT INTO [users] ([position_request_id], [job_id], [name], [title]) OUTPUT INSERTED.[position_request_id], INSERTED.[job_id] VALUES (42, 1337, 'John Smith', 'Hacker')
qb.returning(['position_request_id', 'job_id']).insert('applicants', {position_request_id: 42, job_id: 1337, name: 'John Smith', title: 'Hacker'});
```

--------------------------------------------------------------------------------

## Execution Methods

API Method                        | SQL Command   | MySQL    | MSSQL    | Oracle | SQLite | Postgres | Mongo
:-------------------------------- | :------------ | :------: | :------: | :----: | :----: | :------: | :---:
[query()](#query)                 | N/A           | &#x2713; | &#x2713; |        |        |          |
[get()](#get)                     | N/A           | &#x2713; | &#x2713; |        |        |          |
[get_where()](#get_where)         | N/A           | &#x2713; | &#x2713; |        |        |          |
[count()](#count)                 | COUNT         | &#x2713; | &#x2713; |        |        |          |
[update()](#update)               | UPDATE        | &#x2713; | &#x2713; |        |        |          |
[update_batch()](#update_batch)   | N/A           | &#x2713; | &#x2713; |        |        |          |
[insert()](#insert)               | INSERT        | &#x2713; | &#x2713; |        |        |          |
[insert_batch()](#insert_batch)   | N/A           | &#x2713; | &#x2713; |        |        |          |
[insert_ignore()](#insert-ignore) | INSERT IGNORE | &#x2713; | &#x2717; |        |        |          |
[delete()](#delete)               | DELETE        | &#x2713; | &#x2713; |        |        |          |
[truncate()](#truncate)           | TRUNCATE      | &#x2713; | &#x2713; |        |        |          |
[empty_table()](#empty_table)     | DELETE        | &#x2713; | &#x2713; |        |        |          |

### What are "Execution Methods"??
Execution methods are the end-of-chain methods in the QueryBuilder library. Once these methods are called, all the chainable methods you've called up until this point will be compiled into a query string and sent to the driver's `query()` method. At this point, the QueryBuilder will be reset and ready to build a new query. The database driver will respond with results depending on the type of query being executed or with an error message.

### Handling Error Messages and Results

#### Callback Style
The final parameter of every execution method will be a callback function. If a callback is supplied to that final parameter, a Promise object *WILL NOT* be returned.

The parameters for the callback are in the `node.js` standard `(err, response)` format. If the driver throws an error, a JavaScript `Standard Error` object will be passed into the `err` parameter. The `response` parameter can be supplied with an array of result rows (`.get()` & `.get_where()`), an integer (`.count()`), or a response object containing rows effected, last insert id, etc... in any other scenario.

#### Promise Style
If a callback function is not supplied to the final parameter of execution methods, a Promise will be returned. If the driver throws an error a JavaScript `Standard Error` object will be sent to the the Promise's `reject` callback parameter. The `response` will be sent to the Promise's `resolve` callback parameter. The `response` can be an array of result rows (`.get()` & `.get_where()`), an integer (`.count()`), or a response object containing rows effected, last insert id, etc... in any other scenario.

Obviously, `async/await` is supported through this style.

### Response Format Examples

API Method(s)                  | Response Format
:----------------------------- | :-----------------------------------------------------------------------------------------
get(), get_where()             | `[{field:value,field2:value2},{field:value, field2:value2}]`
count()                        | Integer (ex. `578`)
insert(), update(), delete()   | Example: `{insert_id: 579, affected_rows: 1, changed_rows: 0 [,and others per DB driver]}`
insert_batch(), update_batch() | Example: `{insert_id: 579, affected_rows: 1, changed_rows: 0 [,and others per DB driver]}`

**NOTE**

When using the [returning()](#returning) method with compatible drivers (`mssql`), the `insert_id` property of the response object will be an array of objects containing key value pairs representing the requested "returned" columns along with their values.

Example:

```javascript
// results: {insert_id: [{id: 12345}], affected_rows: 1, changed_rows: 0}
const results = await qb.returning('id').insert('users', {firstName: 'John', lastName: 'Smith'});
```

#### Callback Example

```javascript
pool.get_connection(qb => qb.get('foo', (err, response) => {
    qb.release();
    if (err) return console.error(err);
    response.forEach((v) => /* Do Something */);
}));
```

#### Promise Example

**Note:** Don't do it this way. It's silly, verbose, and out-dated.

```javascript
pool.get_connection().then(qb => {
    const result = qb.get('foo');
    qb.release();
    return result;
}).then(response => {
    response.forEach((v) => /* Do Something */);
    return response;
}).catch(err =>{
    return console.error(err);
});
```

#### Async/Await Example

```javascript
async function getFoo() {
    let qb;
    try {
        qb = await pool.get_connection();
        const response = qb.get('foo');
        response.forEach((v) => /* Do Something */);
    } catch (err) {
        console.error(err);
    } finally {
        if (qb) qb.release();
    }
}

getFoo();
```

#### Using the Same Connection Pool Connection for Successive Calls

This is an ideal scenario for the async/await pattern.

```javascript
const pool = new require('node-querybuilder')(settings,'mysql','pool');
const data = {first_name: 'John', last_name: 'Smith'};

async function addUser() {
    let qb;
    try {
        qb = await pool.get_connection();
        const results = await qb.insert('users', data);

        if (results.affected_rows === 1) {
            const user = await qb.get_where('users', {id: res.insert_id});
            console.log('New User: ', user);
        } else {
            throw new Error("New user was not added to database!");
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (qb) qb.release();
    }
}

updateUser();
```

--------------------------------------------------------------------------------

<a name="query"></a>

### .query(query_string[, callback])

Parameter    | Type     | Default   | Description
:----------- | :------- | :-------- | :---------------------------------------------
query_string | String   | Required  | Query to send directly to your database driver
callback     | Function | undefined | (optional) What to do when the driver has responded

*****This method bypasses the entire QueryBuilder portion of this module***** is simply uses your database driver's native querying method. You should be cautious when using this as none of this module's security and escaping functionality will be utilized.

There are scenarios when using this method may be required; for instance, if you need to run a very specific type of command on your database that is not typical of a standard, CRUD-type query (ex. user permissions or creating a view).

**Example**

```javascript
const sql = qb.select(['f.foo', 'b.bar'])
    .from('foo f')
    .join('bar b', 'b.foo_id=f.id', 'left')
    .get_compiled_select();

qb.query("CREATE VIEW `foobar` AS " + sql, callback);
```

--------------------------------------------------------------------------------

<a name="get"></a>

### .get([table[,callback]])

Parameter | Type     | Default    | Description
:-------- | :------- | :--------- | :------------------------------------------------------------
table     | String   | undefined  | (optional) Used to avoid having to call `.from()` seperately.
callback  | Function | undefined  | (optional) What to do when the driver has responded

This method is used when running queries that might respond with rows of data (namely, "SELECT" statements...). You can pass a table name as the first parameter to avoid having to call [.from()](#from) separately. If the table name is omitted, and the first parameter is a callback function, there will be no need to pass a callback function into the second parameter.

**Response Type**

Array of rows/records

**Examples**

If you want to provide a table name into the first parameter:

```javascript
// SELECT * FROM `galaxies`
qb.get('galaxies', callback);
```

If you already have the table added to the query:

```javascript
// SELECT * FROM `galaxies`
qb.from('galaxies').get(callback);
```

Just a more-complicated example for the sake of it:

```javascript
/**
 * SELECT
 *    `g`.`name`,
 *    `g`.`diameter`,
 *    `g`.`type_id`,
 *    `gt`.`name` AS `type`,
 *    COUNT(`s`.`id`) as `num_stars`
 * FROM `galaxies` `g`
 * LEFT JOIN `galaxy_types` `gt` ON `gt`.`id`=`g`.`type_id`
 * LEFT JOIN `stars` `s` ON `s`.`galaxy_id`=`g`.`id`
 * GROUP BY `g`.`id`
 * ORDER BY `g`.`name` ASC
 * LIMIT 10
 **/
qb.limit(10)
    .select(['g.name', 'g.diameter', 'gt.name as type'])
    .select('COUNT(`s`.`id`) as `num_stars`',null,false)
    .from('galaxies g')
    .join('galaxy_types gt', 'gt.id=g.type_id', 'left')
    .join('stars s', 's.galaxy_id=g.id', 'left')
    .group_by('g.id')
    .order_by('g.name', 'asc')
    .get((err, response) => {
        if (err) return console.error(err);

        response.forEach(row => {
            console.log(`The ${row.name} is a ${row.diameter} lightyear-wide ${row.type} galaxy with ${row.num_stars} stars.`);
        });
    });
```

--------------------------------------------------------------------------------

<a name="get_where"></a>

### .get_where(table, where[, callback])

Parameter | Type            | Default   | Description
:-------- | :-------------- | :-------- | :-------------------------------------------------
table     | String or Array | Required  | Used to avoid having to call `.from()` separately.
where     | Object          | Required  | Used to avoid having to call `.where()` separately
callback  | Function        | undefined | (optional) What to do when the driver has responded.

This method is basically the same as the `.get()` method except that if offers an additional shortcut parameter to provide a list of filters (`{field_name:value}`)  to limit the results by (effectively a shortcut to avoid calling `.where()` separately).  The other difference is that _all_ parameters are required and they must be in the proper order.

**Response Type**

Array of objects representing the result rows.

**Examples**

Basic example:

```javascript
// SELECT * FROM `galaxies` WHERE `num_stars` > 100000000
qb.get_where('galaxies', {'num_stars >': 100000000}, callback);
```

You can still provide other where statements if you want—they'll all work happily together:

```javascript
// SELECT * FROM `galaxies` WHERE `num_stars` > 100000000 AND `galaxy_type_id` = 3
qb.where('num_stars >', 100000000).get_where('galaxies', {galaxy_type_id: 3}, callback);
```

--------------------------------------------------------------------------------

<a name="count"></a>

### .count([[table[, callback]])

Parameter | Type     | Default    | Description
:-------- | :------- | :--------- | :------------------------------------------------------------
table     | String   | undefined  | (optional) Used to avoid having to call `.from()` separately.
callback  | Function | undefined  | (optional) What to do when the driver has responded.

This method is used to determine the total number of results that a query would return without actually returning the entire resultset back to this module. Obviously, you could simply execute the same query with `.get()` and then check the `length` property of the response array, but, that would take significantly more time and memory for very large resultsets.

The field in the resultset will always labeled be 'numrows'.

**Response Type**

Integer

**Examples**

```javascript
// SELECT COUNT(*) AS `numrows` FROM `galaxies` WHERE `type` = 3
const type = 3;
qb.where('type', type).count('galaxies', (err, count) => {
    if (err) return console.error(err);
    console.log("There are " + numrows + " Type " + type + " galaxies in the Universe.");
});
```

--------------------------------------------------------------------------------

<a name="update"></a>

### .update(table, data[,where][, callback])

Parameter | Type     | Default   | Description
:-------- | :------- | :-------- | :----------------------------------------------------------------------------------------------------
table     | String   | null      | (suggested) The table/collection you'd like to update
data      | Object   | null      | (suggested) The data to update (ex. `{field: value}`)
where     | Object   | null      | (optional) Used to avoid having to call `.where()` separately. Pass NULL if you don't want to use it.
callback  | Function | undefined | (optional) What to do when the driver has responded.

This method is used to update a table (SQL) or collection (NoSQL) with new data. All identifiers and values are escaped automatically when applicable. The response parameter of the callback should receive a response object with information like the number of records updated, and the number of changed rows...

**NOTE:**

The first and second parameters are not required but I do suggest you use them as your code will be much easier to read. If you choose not to use them, you will need to pass a "falsey" value to each... you can't simply skip them. My recommendation is to use `null`. The way you would supply these values without using this method would be through the `from()` method for the first parameter and the `set()` method for the second parameter.

**Response Type**

Object containing information about the results of the query.

**Examples**

Here's a contrived example of how it might be used in an app made with the Express framework:

```javascript
const express = require('express');
const app = express();
const settings = require('db.json');
const pool = new require('node-querybuilder')(settings, 'mysql', 'pool');

app.post('/update_account', (req, res) => {
    const user_id = req.session.user_id;
    const sanitize_name = name => name.replace(/[^A-Za-z0-9\s'-]+$/,'').trim();
    const sanitize_age = age => age.replace(/[^0-9]+$/,'').trim();

    const data = {
        first_name: sanitize_name(req.body.first_name),
        last_name: sanitize_name(req.body.last_name),
        age: sanitize_age(req.body.last_name),
        bio: req.body.bio,
    };

    pool.get_connection(qb => {
        qb.update('users', data, {id:user_id}, (err, res) => {
            qb.release();
            if (err) return console.error(err);

            const page_data = {
                prefill: data,
            }
            return res.render('/account_updated', page_data);
        });
    });
});
```

Here's another (more-direct) example where one decided to supply the table, data, and filters through alternative methods:

```javascript
const qb = new require('node-querybuilder')(settings, 'mysql', 'single');
qb.where('id', 42)
    .from('users')
    .set('email', 'email@domain.net')
    .update(null, null, null, (err, res) => {
        if (err) return console.error(err);
        console.log("Updated: " + res.affected_rows + " rows");
    });
```

--------------------------------------------------------------------------------

<a name="update_batch"></a>

### .update_batch(table, dataset, index[,where][, callback])

Parameter | Type     | Default   | Description
:-------- | :------- | :-------- | :----------------------------------------------------------------------------------------------------
table     | String   | Required  | The table/collection you'd like to insert into
dataset   | Array    | Required  | An array of data (rows) to update (ex. `[{id: 3, field: value}, {id: 4, field: val}]`)
index     | String   | Required  | Name of the key in each data object that represents a `where` clause.
where     | Object   | NULL      | (optional) Used to avoid having to call `.where()` separately. Pass NULL if you don't want to use it.
callback  | Function | undefined | (optional) What to do when the driver has responded.

This method is a somewhat-complex one and, when using transactional databases, a bit pointless. Nevertheless, this will allow you to update a batch of rows with one query which, in theory, should be faster than running multiple update queries.

The important thing to understand is that there are, essentially, _two_ `where` clause portions with this method: a local one, and a global one. The `index` you specify in the 3rd parameter represents the name of the key in each data object of the dataset that will act as the local `where` clause for that particular row to be updated. That row, however, will only be updated if the global where clause(s) (4th param) have been satisfied as well.

**NOTE:** This method will create batches of up to 100 rows at a time. So, if you have 250 rows to update, this will make 3 queries to your database.

**Example:**

```javascript
const qb =  new require('node-querybuilder')(settings, 'mysql', 'single');

// The key to use as the local where clause
const key = 'id';

// All objects in this dataset must have an id key
const dataset = [
    {id: 4569, name: 'Cartwheel', constellation: 'Sculptor'},
    {id: 5631, name: 'Black Eye', constellation: 'Coma Berenices'},
    {id: 1238, name: 'Sombrero',  constellation: 'Virgo'}
];

const where = {'last_updated <' : '2015-01-01'}

qb.update_batch('galaxies', dataset, key, where, (err, res) => {
    if (err) return console.error(err);

    /*
     * UPDATE `galaxies`
     * SET
     * `name` = CASE
     *      WHEN `id` = 4569 THEN 'Cartwheel'
     *      WHEN `id` = 5631 THEN 'Black Eye'
     *      WHEN `id` = 1238 THEN 'Sombrero'
     *      ELSE `name`
     * END,
     * `constellation` = CASE
     *      WHEN `id` = 4569 THEN 'Sculptor'
     *      WHEN `id` = 5631 THEN 'Coma Berenices'
     *      WHEN `id` = 1238 THEN 'Virgo'
     *      ELSE `constellation`
     * END
     * WHERE `id` IN(4569, 5631, 1238)
     * AND `last_updated` < '2015-01-01'
     */
    const last_query = qb.last_query();
});
```

As you can see, in each `CASE` statement, the `key` and it's value are being used to determine what to set the other items to. It's important to know that the `key` and it's `value` will not be updated in the batch update... they are just there to make sure we set the right values in the right place.

--------------------------------------------------------------------------------

<a name="insert"></a>

### .insert(table, data[,ignore[,on_dupe]][, callback])

Parameter | Type     | Default    | Description
:-------- | :------- | :--------- | :--------------------------------------------------------------------------------------------------------------
table     | String   | Required   | The table/collection you'd like to insert into
data      | Object   | Required   | The data to insert (ex. `{field: value}`)
ignore    | Boolean  | false      | (optional) If TRUE, generates IGNORE syntax for your driver if it's supported; ignored (haha) if not supported.
on_dupe   | String   | undefined  | (optional) Query suffix needed for generating an 'upsert' (ex. `ON DUPLICATE KEY UPDATE ...`).
callback  | Function | undefined  | (optional) What to do when the driver has responded.

This method is used to insert new data into a table (SQL) or collection (NoSQL). All identifiers and values are escaped automatically when applicable. The response parameter of the callback (or the Promise resolution value) should receive a response object with information like the ID of the newly inserted item, the affected rows (should be 1), etc...

**Response Type**

Object containing information about the result of the query.

**Examples**

Here's a contrived example of how it might be used in an app made with the Express framework:

```javascript
const express = require('express');
const app = express();
const settings = require('db.json');
const pool = new require('node-querybuilder')(settings, 'mysql', 'pool');

app.post('/add_article', (req, res) => {
    const user_id = req.session.user_id;

    const data = {
        title: req.body.first_name,
        body: req.body.last_name,
        author: user_id,
        publish_date: sanitize_age(req.body.last_name)
    };

    pool.get_connection(qb => {
        qb.insert('articles', data, (err, res) => {
            qb.release();
            if (err) return console.error(err);

            const page_data = {
                article_id: res.insert_id,
            }
            return res.render('/article_manager', page_data);
        });
    });
});
```

--------------------------------------------------------------------------------

<a name="insert_batch"></a>

### .insert_batch(table, dataset[,ignore[,on_dupe]][, callback])

Parameter | Type     | Default   | Description
:-------- | :------- | :-------- | :------------------------------------------------------------------------------------------------------------------
table     | String   | Required  | The table/collection you'd like to delete records from.
dataset   | Array    | undefined | An array of objects containing the data you want to insert. Pass *can* pass an empty array if you want to be silly.
ignore    | Boolean  | false     | (optional) If TRUE, generates IGNORE syntax for your driver if it's supported; ignored (haha) if not supported.
on_dupe   | String   | undefined | (optional) Query suffix needed for generating an 'upsert' (ex. `ON DUPLICATE KEY UPDATE ...`).
callback  | Function | undefined | (optional) What to do when the driver has responded.

The goal of this method is to speed the insertion of many rows. For instance, if you were insert 1,000 rows... Instead of making 1,000 queries to the server, you could just call `insert_batch()` and it would generate a single query to insert 1,000 rows. This is _much_ more efficient and less taxing on your app and database server.

**Response Type**

Object containing information about the result of the query.

**Example**

```javascript
const qb = new require('node-querybuilder')(settings, 'mysql');

const data = [
    {name: 'MySQL', version: '5.5.40'},
    {name: 'Mongo', version: '2.6.7' },
    {name: 'Postgres', version: '8.4'}
];

qb.insert_batch('db_engines', data, (err, res) => {
    if (err) throw err;

    // INSERT INTO `db_engines` (`name`, `version`)
    // VALUES ('MySQL', '5.5.40'), ('Mongo', '2.6.7'), ('Postgres', '8.4');
    console.log(qb.last_query());
});
```

--------------------------------------------------------------------------------

<a name="insert_ignore"></a>

### .insert_ignore(table, data[,on_dupe][, callback])

Parameter | Type     | Default   | Description
:-------- | :------- | :-------- | :------------------------------------------------------------------------------------------------------------------
table     | String   | Required  | The table/collection you'd like to delete records from.
data      | Object   | undefined | An array of objects containing the data you want to insert. Pass *can* pass an empty array if you want to be silly.
on_dupe   | String   | undefined | (optional) Query suffix needed for generating an 'upsert' (ex. `ON DUPLICATE KEY UPDATE ...`).
callback  | Function | undefined | (optional) What to do when the driver has responded.

This method is just a wrapper to the `insert()` method which passes `true` to the ignore parameter. The purpose of using `IGNORE` syntax, for the drivers that support it, is so that a row insertion will be skipped if it's an exact duplicate of another row in the database. Optionally, you can provide a 3rd parameter containing a query that will update specified keys in the case of a duplicate entry (instead of simply ignoring it). With the third parameter, you can create an 'upsert' of sorts. Without the third parameter, it's essentially just "ignoring" errors, or, rather, converting them to simple warnings.

**Response Type**

Object containing information about the result of the query.

**Example**

```javascript
/*
 * Current Table Structure:
 *
 * [
 *        {name: 'MySQL', version: '5.5.40', last_modified: 1423252221 },
 *        {name: 'Mongo', version: '2.6.7',  last_modified: 1423252232 },
 *        {name: 'Postgres', version: '8.4', last_modified: 1423252248 }
 *    ]
 */

const qb = new require('node-querybuilder')(settings, 'mysql');
const data = {name: 'Postgres', version: '8.4'};
qb.insert_ignore('db_engines', data, (err, res) => {
    if (err) throw err;

    // INSERT IGNORE INTO `db_engines` (`name`, `version`) VALUES ('Postgres', '8.4');
    console.log(qb.last_query());

    // 0 (because this data already exists...)
    console.log(res.affected_rows);
});
```

This time we'll do it with an `on_dupe` string

```javascript
const data = {name: 'Postgres', version: '8.4'};
qb.insert_ignore('db_engines', data, 'ON DUPLICATE KEY UPDATE last_modified = NOW()', (err, res) => {
    if (err) throw err;

    // INSERT IGNORE INTO `db_engines` (`name`, `version`) VALUES ('Postgres', '8.4') ON DUPLICATE KEY UPDATE last_modified = NOW();
    console.log(qb.last_query());

    // 1 (because we updated the last_modified field)
    console.log(res.affected_rows);

    /*
     * Resulting Table Structure:
     *
     * [
     *        {name: 'MySQL', version: '5.5.40', last_modified: 1423252221 },
     *        {name: 'Mongo', version: '2.6.7',  last_modified: 1423252232 },
     *        {name: 'Postgres', version: '8.4', last_modified: 1423264972 }
     *    ]
     */
});
```

--------------------------------------------------------------------------------

<a name="delete"></a>

### .delete(table, where[, callback])

Parameter | Type     | Default   | Description
:-------- | :------- | :-------- | :----------------------------------------------------------------------------------------------------
table     | String   | Required  | The table/collection you'd like to delete records from.
where     | Object   | undefined | (optional) Used to avoid having to call `.where()` separately. Pass NULL if you don't want to use it.
callback  | Function | undefined | (optional) What to do when the driver has responded.

This method is used to delete records from a table (SQL) or collection (NoSQL). All identifiers and values are escaped automatically when applicable. The response parameter of the callback should receive a response object with the number of affected rows.

**NOTE:** If tables are added to the querybuilder query cache via the `from()` method, only first table in the array (the first added) will be used for this method.

**Response Type**

Object containing information about the result of the query.

**Examples**

Here's a contrived example of how it might be used in an app made with the Express framework (NOTE: you should do better with error handling):

```javascript
const express = require('express');
const app = express();
const settings = require('db.json');
const pool = new require('node-querybuilder')(settings, 'mysql', 'pool');

app.post('/delete_comment/:id', async (req, res) => {
    const id = req.params.id;
    let qb;

    try {
        qb = await pool.get_connection();
        const comment = qb.get('comments', {id});
        const comment_id = comment.id;
        const results = await qb.delete('comments', {id: comment_id});
        const num_removed = res.affected_rows;
        return res.render(`/article/${article_id}`, {num_removed});
    } catch (err) {
        console.error(err);
        return res.status(400).send('Something bad happened.');
    } finally {
        if (qb) qb.release();
    }
});
```

--------------------------------------------------------------------------------

<a name="truncate"></a>

### .truncate(table[, callback])

Parameter | Type     | Default   | Description
:-------- | :------- | :-------- | :-------------------------------------------
table     | String   | Required  | The table/collection you'd like to truncate.
callback  | Function | undefined | (optional) What to do when the driver has responded.

For drivers that support it (MySQL, MSSQL), this method will utilize the `TRUNCATE` directive to empty a table of all it's data. The main difference between the `truncate()` method and the `empty_table()` method is that, when available, and when possible, truncating a table will reset your AUTO_INCREMENT counter back to zero. If you simply delete every row from a table, the next item inserted will just continue with the next highest ID from the deleted records.

For drivers that don't support the truncate method, this will simply act as a wrapper to the [.empty_table()](#empty_table) method.

**Response Type**

Object containing information about the result of the query.

**Examples**

```javascript
const settings = require('db.json');
const pool = new require('node-querybuilder')(settings, 'mysql', 'pool');

/*
 * Assume we have a table (with auto-incrementing ID) like this to start with...
 * [
 *   { id: 1, name: 'Mary' },
 *   { id: 2, name: 'Jane' },
 *   { id: 3, name: 'Joe'  }
 * ];
 */

async function deleteUser() {
    let qb;
    try {
        qb = await pool.get_connection();
        await qb.truncate('users');
        await qb.insert('users', { name: 'Bob' });
        const results = await qb.get_where('users', { id: res.insert_id });

        // { id: 1, name: 'Bob' } (notice ID is 1)
        console.log('Results: ', results);
    } catch (err) {
        console.error(err);
    } finally {
        if (qb) qb.release();
    }
}

deleteUser();
```

--------------------------------------------------------------------------------

<a name="empty_table"></a>

### .empty_table(table[, callback])

Parameter | Type     | Default  | Description
:-------- | :------- | :------- | :-------------------------------------------
table     | String   | Required | The table/collection you'd like to truncate.
callback  | Function | Required | What to do when the driver has responded.

This method will allow you to delete all records from a table/collection.

**Note:** This will *not* reset your `AUTO_INCREMENT`ing primary key field. For that, please use the [.truncate()](#truncate) method where possible.

**Response Type**

Object containing information about the result of the query.

**Examples**

```javascript
const settings = require('db.json');
const pool = new require('node-querybuilder')(settings, 'mysql', 'pool');

/*
 * Assume we have a table like this to start with...
 * [
 *   { id: 1, name: 'Mary' },
 *   { id: 2, name: 'Jane' },
 *   { id: 3, name: 'Joe'  }
 * ];
 */

pool.get_connection(qb => {
    qb.empty_table('users', (err, res) => {
        if (err) throw err;
        qb.insert('users', {name: 'Bob'}, (err, res) => {
            if (err) throw err;
            qb.get_where('users', {id: res.insert_id}, (err, res) => {
                qb.release();
                if (err) throw err;
                // { id: 4, name: 'Bob' } (notice ID is 4)
                console.dir(res);
            });
        });
    });
});
```

--------------------------------------------------------------------------------

## Other Library-Specific Methods
These are methods that are not part of the query-building chain, but, rather, methods you might call before, after, or during (but not as part of) building a query.

API Method                                    | MySQL    | MSSQL    | Oracle   | SQLite   | Postgres | Mongo
:-------------------------------------------- | :------: | :------: | :------: | :------: | :------: | :------:
[connection](#connection_settings)            | &#x2713; | &#x2713; |          |          |          |
[connection_settings()](#connection_settings) | &#x2713; | &#x2713; |          |          |          |
[disconnect()](#disconnect)                   | &#x2713; | &#x2713; |          |          |          |
[escape()](#escape)                           | &#x2713; | &#x2713; |          |          |          |
[get_connection()](#get_connection)           | &#x2713; | &#x2713; |          |          |          |
[last_query()](#last_query)                   | &#x2713; | &#x2717; |          |          |          |
[release()](#release)                         | &#x2713; | &#x2713; |          |          |          |
[get_compiled_select()](#get_compiled_select) | &#x2713; | &#x2713; |          |          |          |
[get_compiled_insert()](#get_compiled_insert) | &#x2713; | &#x2713; |          |          |          |
[get_compiled_update()](#get_compiled_update) | &#x2713; | &#x2713; |          |          |          |
[get_compiled_delete()](#get_compiled_delete) | &#x2713; | &#x2713; |          |          |          |

--------------------------------------------------------------------------------

<a name="connection"></a>

### .connection()

Get a reference to an instance of the connection handle from the driver that's being utilized under the surface. With that connection handle instance, you can run any of the native methods from that driver that don't have equivalents in this library. For instance, with the `mssql` driver, you would be able to execute stored procedures.

**Example**

```javascript
const settings = require('db.json');
const pool = new require('node-querybuilder')(settings, 'mssql', 'pool');

pool.get_connection(qb => {
    const conn = qb.get_connection();
    const request = new conn.Request();

    request.input('input_parameter', sql.Int, 8675309);
    request.output('output_parameter', sql.Int);

    request.execute('call_phone_number', (err, result) => {
        qb.release();
        // Do stuff
    });
});
```

--------------------------------------------------------------------------------

<a name="connection_settings"></a>

### .connection_settings()

Simply returns your connection settings object (the configuration object used to create your QueryBuilder instance) for reference or use elsewhere. This is not something you'll likely find yourself using but we'll document it nonetheless.

**Example**

```javascript
const settings = require('db.json');
const qb = new require('node-querybuilder')(settings, 'mssql');

// This results in the same value as the value of the `settings` variable
const connection_settings = qb.connection_settings();
```

--------------------------------------------------------------------------------

<a name="disconnect"></a>

### .disconnect([callback])

Parameter | Type     | Default   | Description
:-------- | :------- | :-------- | :---------------------------------------------------------
callback  | Function | undefined | (optional) What to do when the connection is fully terminated.

Disconnect from the server after your query is complete. You _must_ call this each time after your done querying the database! **NOTE:** You would _not_ use this when using a connection pool. This should only be called when working with single one-off connections (command-line scripts, for example). After disconnecting, all subsequent queries will fail unless you reconnect ([connect()](#connect)).

**Examples**

Below is a contrived example that gets a list of all users in a users table where their username starts with a `|` (pipe) character. It then loops over each one and removes the `|` from the username and re-inserts it. Notice that the connection is not terminated until all the queries that needed to be executed have been executed.

```javascript
const settings = require('db.json');
const qb = new require('node-querybuilder')(settings, 'mysql');

qb.like('username','|','right').get_where('users', {active: true}, (err, res) => {
    let users = res;
    (function update_user() {
        const user = users.shift();
        user.username = user.username.replace(/\^|/,'');

        qb.update('users', user, {id: user.id}, (err, res) => {
            if (err) {
                console.error("Failed to update user...", err);
                qb.diconnect();
            }

            if (user.length > 0) {
                setTimeout(update_user, 0);
            } else {
                qb.disconnect();
            }
        });
    })();
});

```

Here's a simpler example so you can better see how it will most often be used:

```javascript
const settings = require('db.json');
const qb = new require('node-querybuilder')(settings, 'mysql');

qb.get_where('users', {username: 'foobar'}, (err, res) => {
    if (err) throw err;
    qb.disconnect((err) => { // NOTE: an error here is unlikely
        if (err) return console.error(err);
        console.log("Success: ", res);
    });
});
```

As with all functions in this library, it has a Promise-style verion as well. Simply don't supply the callback and a Promise will be returned. Here's an example:

```javascript
const settings = require('db.json');
const qb = new require('node-querybuilder')(settings, 'mysql');

async function getFooUsers() {
    try {
        const res = await qb.get_where('users', {username: 'foobar'});
        await qb.disconnect();
        console.log("Success: ", res);
    } catch (err) {
        if (err) console.error(err);
    }
}

getFooUsers();
```

--------------------------------------------------------------------------------

<a name="escape"></a>

### .escape(value)

Parameter | Type  | Default  | Description
:-------- | :---- | :------- | :------------------------------------------------
value     | Mixed | Required | The value to escape based on your database driver

This can be used to escape a value using your driver's native escape method. If your driver does not have a native escape method, the value will simply be returned. This is useful for when you want to build a SQL string manually (for instance, you don't want certain items to be escaped).

**What should happen:** _Examples given are for MySQL_

Input Type | Output Type | Ex. Input          | Ex. Output
:--------- | :---------: | :----------------: | :------------------------:
String     | String      | "\n\s\x1a"         | "\\n\\s\\x1a"
Integer    | String      | 76                 | '76'
Array      | String      | [1,2,3]            | '1','2',3'
Date       | String      | new Date()         | '2015-01-30 16:54:23.1856'
Buffer     | String      | new Buffer(1)      | 'X\'00\''
Object     | String      | {foo: 'bar', i: 3} | "`foo` = 'bar', `i` = 3"

**Example**

```javascript
const qb = new require('node-querybuilder')(require('db.json'), 'mysql');
const sql = 'SELECT count(*) FROM `star_systems` WHERE ' + qb.escape({planet_num: 5}) + ' LIMIT 10';
qb.query(sql, (err, res) => {
    // SELECT count(*) FROM `star_systems` WHERE `planet_num` = 5 LIMIT 10
    console.log(res);
});
```

--------------------------------------------------------------------------------

<a name="get_connection"></a>

### .get_connection([callback])

Parameter | Type     | Default  | Description
:-------- | :------- | :------- | :---------------------------------------------------------
callback  | Function | Required | What to do when the connection is retrieved (or not) from the pool.

Used to get a new connection from the connection pool or cluster pool. An instance of the QueryBuilder adapter for your specific connection will be passed to the callback or Promise resolution. Make sure that your connection is [release](#release)d when you are done with it!

**Callback Example**

```javascript
const settings = require('db.json');
const pool = new require('node-querybuilder')(settings, 'mysql', 'pool');

pool.get_connection(qb => {
    qb.limit(10).get('users', (err, res) => {
        qb.release();
        if (err) return console.error(err);
        // Do stuff with results
    });
});
```

**Async/Await Example**

```javascript
const settings = require('db.json');
const pool = new require('node-querybuilder')(settings, 'mysql', 'pool');

async function getUsers() {
    let qb;
    try {
        qb = await pool.get_connection();
        const res = await qb.limit(10).get('users');
        // Do stuff with results
    } catch (err) {
        console.error(err);
    } finally {
        if (qb) qb.release();
    }
}

getUsers();
```

--------------------------------------------------------------------------------

<a name="last_query"></a>

### .last_query()
This is used to retrieve the query string that was most-recently executed. This MUST be called before closing the connection or releasing a connection back to the pool. This is useful for debugging what the `node-querybuilder` library is executing (or trying to execute).

If you'd rather the engine not execute the query first, you can always use the appropriate [compilation methods](#compilation_methods) detailed below.

**Examples**

```javascript
const settings = require('db.json');
const pool = new require('node-querybuilder')(settings, 'mysql', 'pool');
pool.get_connection(qb => {
    const id = 4531;
    qb.get('comments', {id}, (err, res) => {
        // SELECT * FROM `comments` WHERE `id` = 4531
        console.log(qb.last_query());
        qb.release();
    });
});
```

--------------------------------------------------------------------------------

<a name="release"></a>

### .release()
Releases a connection back to the pool when you are done with it. Calling this is _super_ important!

**Examples**

Below is a contrived example (with no error handling--for brevity) that gets a list of all users in a users table where their username starts with a `|` character. It then loops over each one and removes the `|` from the username and re-inserts it. Notice that the connection is not released until all the queries that needed to be executed have been executed.

```javascript
const settings = require('db.json');
const pool = new require('node-querybuilder')(settings, 'mysql', 'pool');

pool.get_connection(qb => {
    qb.like('username','|','right').get_where('users', {active: true}, (err, res) => {
        let users = res;
        (function update_user() {
            const user = users.shift();
            user.username = user.username.replace(/\^|/,'');

            qb.update('users', user, {id: user.id}, (err, res) => {
                if (user.length > 0) {
                    setTimeout(update_user, 0);
                } else {
                    qb.release();
                }
            });
        })();
    });
});
```

Here's a simpler example so you can better see how it will most often be used

```javascript
const settings = require('db.json');
const pool = new require('node-querybuilder')(settings, 'mysql', 'pool');

pool.get_connection(qb => {
    qb.get_where('users', {username: 'foobar'}, (err, res) => {
        qb.release();
        if (err) throw err;
        console.dir(res);
    });
});
```

--------------------------------------------------------------------------------

<a name="compilation_methods"></a>

### SQL Compilation Methods
These methods can be used to build a query string without having to execute it. This is a fantastic option if you want to use the querybuilder to simply build queries and display the resulting string or to send the compiled query string off to a driver/engine other than the one offered by `node-querybuilder`.

These are also excellent educational tools and can be used like a SQL/NoSQL language Rosetta Stone of sorts.

These methods are not asynchronous and, therefore, just return the compiled query string.

--------------------------------------------------------------------------------

<a name="get_compiled_select"></a>

#### .get_compiled_select(table)
**_Alias:_** _compile_select(table)_

Parameter | Type   | Default   | Description
:-------- | :----- | :-------- | :----------------------------------------------------------
table     | String | Undefined | (optional) Used to avoid having to call .from() separately.

Compiles a SELECT-like query into a properly-escaped string.

**Example:**

Get certain details of a user account

```javascript
const qb = new require('node-querybuilder')(require('db.json'), 'mysql');

const sql = qb
    .select(['id','username','first_name','last_name'])
    .from('users')
    .like('username','k','after')
    .get_compiled_select();

// SELECT `id`, `username`, `first_name`, `last_name` FROM `users` WHERE `username` LIKE 'k%'
console.log(sql);
```

--------------------------------------------------------------------------------

<a name="get_compiled_insert"></a>

#### .get_compiled_insert(table)
**_Alias:_** _compile_insert(table)_

Parameter | Type   | Default   | Description
:-------- | :----- | :-------- | :----------------------------------------------------------
table     | String | Undefined | (optional) Used to avoid having to call .from() separately.

Compiles a INSERT-like query into a properly-escaped string.

**Example:**

Add a new user to a `users` table.

```javascript
const qb = new require('node-querybuilder')(require('db.json'), 'mysql');
const crypto = require('crypto');
const data = {
    username: 'foobar',
    password: crypto.createHash('sha1').update('password').digest('hex'),
    first_name: 'Foo',
    last_name: 'Bar'
};
const sql = qb.set(data).get_compiled_insert('users');

// INSERT INTO `users` (`username`, `password`, `first_name`, `last_name`) VALUES ('foobar', '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8', 'Foo', 'Bar')
console.log(sql);
```

--------------------------------------------------------------------------------

<a name="get_compiled_update"></a>

#### .get_compiled_update(table)
**_Alias:_** _compile_update(table)_

Parameter | Type   | Default   | Description
:-------- | :----- | :-------- | :----------------------------------------------------------
table     | String | Undefined | (optional) Used to avoid having to call .from() separately.

Compiles an UPDATE-like query into a properly-escaped string.

**Example:**

Update the password of a user

```javascript
const qb = new require('node-querybuilder')(require('db.json'), 'mysql');
const crypto = require('crypto');
const data = {
    password: crypto.createHash('sha1').update('P@$$w0rD').digest('hex'),
};
const sql = qb
    .where('id', 4321)
    .set(data)
    .get_compiled_update('users');

// UPDATE `users` SET `password` = '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8' WHERE `id` = 4321
console.log(sql);
```

--------------------------------------------------------------------------------

<a name="get_compiled_delete"></a>

#### .get_compiled_delete(table)
**_Alias:_** _compile_delete(table)_

Parameter | Type   | Default   | Description
:-------- | :----- | :-------- | :----------------------------------------------------------
table     | String | Undefined | (optional) Used to avoid having to call .from() separately.

Compiles a SELECT-like query into a properly-escaped string.

**Example:**

Delete a user

```javascript
const qb = new require('node-querybuilder')(require('db.json'), 'mysql');
const sql = qb.where('id', 4321).get_compiled_delete('users');

// DELETE FROM `users` WHERE `id` = 4321
console.log(sql);
```

--------------------------------------------------------------------------------

# Contribute
Got a missing feature you'd like to use? Found a bug? Go ahead and fork this repo, build the feature and issue a pull request.

[npm-version-image]: https://img.shields.io/npm/v/node-querybuilder.svg
[npm-downloads-image]: https://img.shields.io/npm/dm/node-querybuilder.svg
[npm-url]: https://npmjs.org/package/node-querybuilder
[travis-image]: https://img.shields.io/travis/kylefarris/node-querybuilder/master.svg
[travis-url]: https://travis-ci.org/kylefarris/node-querybuilder
[node-image]: https://img.shields.io/node/v/node-querybuilder.svg
[node-url]: https://nodejs.org/en/download
