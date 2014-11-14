Universal QueryBuilder for Node.js
======================================

Node-QueryBuilder is an ambitious attempt to create a kind of "universal translator" which provides programmers a consistent API to connect to and query *any* database (traditional and NoSQL) supported by the module. The module is highly extensible and, in theory, can suppport any database provided that the driver has been written for it.

The API of this module very closely mimics Codeigniter's Active Record (now called "Query Builder") library and much of the code has been directly translated from the PHP libraries in Codeigniter to JavaScript. A lot of credit needs to go to the folks over at EllisLab (https://ellislab.com/codeigniter) and all the contributors to the Codeigniter project (of which I am one): https://github.com/EllisLab/CodeIgniter/

The primary benefits of this module (currently) are:

* Ability to write queries agnostically to the database you intend to query
* Supports all basic database commands (insert, update, delete, select, etc...)
* Extend capabilities from the most popular native database drivers in NPM.
* Supports method chaining
* Automatically escapes field values and identifiers by default
* Is fully unit tested
* **Very thoroughly documented**
* Allows for greater flexibility and more control over a full ORM
* Ligher-weight than an ORM
* Allows you to drop down to the native methods of your driver if you choose to
* Allows for different drivers for different versions (SQLite 2 vs SQLite 3)
* The order in which you call the methods is irrelevant except for the execution methods (get, insert, update, delete) which must be called last.
* Can used as a learning tool/Rosetta stone

Table of Contents
=================

* [Database Drivers](#database-drivers)
* [How to Install](#how-to-install)
* [License Info](#license-info)
* [Quick Example](#quick-example)
* [Connecting to Your Database](#connecting-to-your-database)
	* [Quick Reference](#quick-reference)
	* [Standard Connection Settings](#standard-connection-settings)
	* [Choosing the Database Type](#choosing-the-database-type)
	* [Choosing the Connection Type](#choosing-the-connection-type)
* [API Methods](#api-methods)
	* [Chainable Methods](#chainable-methods)
	* [Execution Methods](#execution-methods)
	* [Other Library-Specific Methods](#other-library-specific-methods)
* [Contribute](#contribute)
 
Database Drivers
================

Currently Written:
------------------
* MySQL / MariaDB
 
Coming Soon:
------------
 
* Postgres
* Microsoft SQL Server
* Oracle
* SQLite
* MongoDB

How to install
==============

	npm install node-querybuilder

License Info
============

Licensed under the GPL license and MIT:

* http://www.opensource.org/licenses/GPL-license.php
* http://www.opensource.org/licenses/mit-license.php

Quick Example
=============

This quick example shows how to connect to and asynchronously query a MySQL database using a single connection.

```javascript
var settings = {
	host: 'localhost',
	database: 'mydatabase',
	user: 'myuser',
	password: 'MyP@ssw0rd'
};
var qb = require('node-querybuilder').QueryBuilder(settings, 'mysql', 'single');

qb.select('name', 'position')
	.where({type: 'rocky', 'diameter <': 12000})
	.get('planets', function(err,response) {
		if (err) return console.error("Uh oh! Couldn't get results: " + err.msg);
		
		// SELECT `name`, `position` FROM `planets` WHERE `type` = 'rocky' AND `diameter` < 12000
		console.log("Query Ran: " + qb.last_query());
		
		// [{name: 'Mercury', position: 1}, {name: 'Mars', position: 4}]
		console.dir(response);
	}
);
```

Connecting to Your Database
===========================

Quick Reference
---------------

| Driver	| Default	| Ready		| single	| pool	| cluster	| Additional Connection Options								|
| :--------	| :------ 	| :-----	| :--------	| :----	| :----		| :--------------------------------------------------------	|
| mysql		| &#x2713;	| Yes		| Yes		| Yes	| Yes		| https://github.com/felixge/node-mysql#connection-options	|
| mssql		|			| No		| Yes		| ???	| ???		|															|
| sqlite	|			| No		| Yes		| ???	| ???		|															|
| oracle	|			| No		| Yes		| ???	| ???		|															|
| postgres	|			| No		| Yes		| ???	| ???		|															|
| mongodb	|			| No		| Yes		| ???	| ???		|															|


Standard Connection Settings
----------------------------

The options listed below are available for all database drivers. Additional properties may be passed if the driver of the database you are connecting to supports them. See the "Additional Connection Options" column above for a link to the a specific driver's connection options documentation.

| Option	| Default 	| Optional 	| Description 									|
| :--------	| :--------	| :--------	| :-------------------------------------------- |
| host		| localhost | No		| The server you're connecting to				|
| user		| NULL		| No		| The database user								|
| password	| NULL		| Yes		| The database `user`'s password				|
| database	| NULL		| Yes		| The database to connect to					|
| pool_size	| 10 		| Yes		| Max connections for `pool` connection type	|

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
var settings = require('db.json');
// Second and third parameters of the QueryBuilder method default to 'mysql' and 'standard', respectively
var qb = require('node-querybuilder').QueryBuilder(settings);
```

Of course you can also just have a normal javascript object directly within your code somwhere if you're honing your inner Chuck Norris:

**Chuck Norris App**

```javascript
var qb = require('node-querybuilder').QueryBuilder({
	host: 'db.myserver.com',
	user: 'myusername',
	password: 'P@s$w0rD',
	database: 'MyDB',
	pool_size: 50
});
```

Choosing the Database Type
--------------------------

This part is super simple. Just pass which one you'd like to use as the second paramter to the constructor (`mysql` is the default):

***Example:***

```javascript
var qb = require('node-querybuilder').QueryBuilder(settings, 'postgres');
```

Choosing the Connection Type
----------------------------

This library currently supports 3 connection methods:

* single (default)
	* This will use the driver's basic single connection capabilities. All connections to your app will use this single database connection. This is usually less than ideal for most web applications but might be quite suitable for command line scripts and the like. 
	* **All drivers must have this connection type**.
* pool
	* This will utilize the driver's connection pooling capabilities if it is offered. Connection pooling allows your application to pull from a pool of connections that were created by the driver. Typically the connections will be handed out to requesting methods in a round-robin fashion. This is ideal for a web application.
* cluster
	* When you have a cluster of servers and you want to create pools of connections to different servers to help load balance your stack, using the `cluster` connection type can come in handy. This is ideal for high-traffic web sites and applications that utilize a farm of database servers as opposed to just one.

**Note:**
You will specify the type of connection as the third parameter to the contructor

**Example:**

```javascript
var qb = require('node-querybuilder').QueryBuilder(settings, 'mysql', 'pool');
```




API Methods
===========

***NOTE:*** The compatibility portions of these tables are subject to change as features and drivers are written!

Chainable Methods
-----------------

Chainable methods can be called as many times as you'd like in any order you like. The final query will not be built and executed until one of the [execution methods](#execution-methods), like `get()`,  are callled. As the name implies, the methods can be chained together indefinitely but this is not required. You definitely call them individually with the same effect at execution time.

| API Method							| SQL Command	| MySQL		| MSSQL	| Oracle	| SQLite	| Postgres	| Mongo	|
| :------------------------------------	| :------------	| :-------:	| :---:	| :-------:	| :-------:	| :-------:	| :---:	|
| [select()](#select)					| SELECT		| &#x2713;	|		|			|			|			|		|
| [distinct()](#distinct)				| DISTINCT 		| &#x2713;	|		|			|			|			|		|
| [select_min()](#min)					| MIN 			| &#x2713;	|		|			|			|			|		|
| [select_max()](#max)					| MAX 			| &#x2713;	|		|			|			|			|		|
| [select_avg()](#avg)					| AVG 			| &#x2713;	|		|			|			|			|		|
| [select_sum()](#sum)					| SUM 			| &#x2713;	|		|			|			|			|		|
| [from()](#from)						| FROM 			| &#x2713;	|		|			|			|			|		|
| [join()](#join)						| JOIN			| &#x2713;	|		|			|			|			|		|
| [where()](#where)						| WHERE 		| &#x2713;	|		|			|			|			|		|
| [where_not_in()](#where_not_in)		| WHERE			| &#x2713;	|		|			|			|			|		|
| [or_where()](#or_where)				| WHERE			| &#x2713;	|		|			|			|			|		|
| [or_where_in()](#or_where_in)			| WHERE			| &#x2713;	|		|			|			|			|		|
| [or_where_not_in()](#or_where_not_in)	| WHERE			| &#x2713;	|		|			|			|			|		|
| [like()](#like)						| LIKE			| &#x2713;	|		|			|			|			|		|
| [or_like()](#or_like)					| LIKE			| &#x2713;	|		|			|			|			|		|
| [or_not_like()](#or_not_like)			| LIKE			| &#x2713;	|		|			|			|			|		|
| [not_like()](#not_like)				| LIKE			| &#x2713;	|		|			|			|			|		|
| [where_in()](#where_in)				| IN 			| &#x2713;	|		|			|			|			|		|
| [group_by()](#group-by)				| GROUP BY		| &#x2713;	|		|			|			|			|		|
| [having()](#having)					| HAVING		| &#x2713;	|		|			|			|			|		|
| [or_having()](#or_having)				| HAVING		| &#x2713;	|		|			|			|			|		|
| [order_by()](#order-by)				| ORDER BY		| &#x2713;	|		|			|			|			|		|
| [limit()](#limit)						| LIMIT			| &#x2713;	|		|			|			|			|		|
| [offset()](#offset)					| OFFSET		| &#x2713;	|		|			|			|			|		|
| [set()](#set)							| SET			| &#x2713;	|		|			|			|			|		|

-------------

### SELECT
#### .select(fields[,escape])

This method is used to specify the fields to pull into the resultset when running SELECT-like queries.

| Parameter	| Type			| Default	| Description 									|
| :--------	| :-------- 	| :-----	| :-------------------------------------------- | 
| fields 	| String/Array	| N/A		| The fields in which to grab from the database |
| escape 	| Boolean		| true		| TRUE: auto-escape fields; FALSE: don't escape |


The fields provided to this method will be automatically escaped by the database driver. The `fields` paramter can be passed in 1 of 2 ways (field names will be trimmed in either scenario):

***NOTE:*** If the select method is never called before an execution method is ran, 'SELECT *' will be assumed.

* String with fields seperated by a comma:
	* `.select('foo, bar, baz')`
* Array of field names
	* `.select(['foo', 'bar', 'baz'])`

**Examples**

```javascript
// SELECT * FROM galaxies
qb.select('*').get('foo',callback);

// Easier and same result:
qb.get('foo',callback);
```

An array of field names:

```javascript
// SELECT `foo`, `bar`, `baz`
qb.select(['foo', 'bar', 'baz']);
```

You can chain the method together using different patterns if you want:

```javascript
// SELECT `foo`, `bar`, `baz`, `this`, `that`, `the_other`
qb.select(['foo', 'bar', 'baz']).select('this,that,the_other');
```

You can alias your field names and they will be escaped properly as well:

```javascript
// SELECT `foo` as `f`, `bar` as `b`, `baz` as `z`
qb.select(['foo as f', 'bar as b', 'baz as z']);
```

You can optionally choose not to have the driver auto-escape the fieldnames (dangerous, but useful if you a utilize function in your select statement, for instance):

```javascript
// SELECT CONCAT(first_name,' ',last_name) AS `full_name`
qb.select('CONCAT(first_name,' ',last_name) AS `full_name`',false);
```

***NOTE:*** If you use this technique to add driver-specific functions, it may (and probably will) cause unexpected outcomes with other database drivers!

-------------

### DISTINCT
#### .distinct()

This SQL command is used to prevent duplicate rows from being returned in the resultset at the database level. It should only be used when querying data (execution methods: `.get()` & `.get_where()`) (not inserting, updating or removing). If it's provided to another execution method, it will simply be ignored.

***This method takes no parameters***

**Example**

```javascript
// SELECT DISTINCT `id`, `name`, `description` FROM `users`
qb.distinct().select('id,name,description').get('users',callback);
```

-------------

### MIN
#### .select_min(field[,alias])

This SQL command is used to find the minimum value for a specific field within a resultset.

| Parameter	| Type		| Default	| Description							|
| :--------	| :-------- | :-----	| :-------------------------------------|
| field 	| String	| Required	| The field to get the minimum value of |
| alias 	| String	| NULL 		| Optional alias to rename field		|

**Examples**

```javascript
// SELECT MIN(`age`) FROM `users`
qb.select_min('age').get('users',callback);
```

You can optionally include a second parameter to rename the resulting field

```javascript
// SELECT MIN(`age`) AS `min_age` FROM `users`
qb.select_min('age', 'min_age').get('users',callback);
```

-------------

### MAX
#### .select_max(field[,alias])

This SQL command is used to find the maximum value for a specific field within a resultset.

| Parameter	| Type		| Default	| Description 							|
| :--------	| :-------- | :-----	| :-------------------------------------|
| field		| String	| Required	| The field to get the maximum value of |
| alias		| String	| NULL		| Optional alias to rename field		|

**Examples**

```javascript
// SELECT MAX(`age`) FROM `users`
qb.select_max('age').get('users',callback);
```

You can optionally include a second parameter to rename the resulting field

```javascript
// SELECT MAX(`age`) AS `max_age` FROM `users`
qb.select_max('age', 'max_age').get('users',callback);
```

-------------

### AVG
#### .select_avg(field[,alias])

This SQL command is used to find the average value for a specific field within a resultset.

| Parameter	| Type		| Default	| Description							|
| :--------	| :-------- | :-----	| :-------------------------------------| 
| field		| String	| Required	| The field to get the average value of |
| alias		| String	| NULL		| Optional alias to rename field		|

**Examples**

```javascript
// SELECT AVG(`age`) FROM `users`
qb.select_avg('age').get('users',callback);
```

You can optionally include a second parameter to rename the resulting field

```javascript
// SELECT AVG(`age`) AS `avg_age` FROM `users`
qb.select_avg('age', 'avg_age').get('users',callback);
```

-------------

### SUM
#### .select_sum(field[,alias])

This SQL command is used to find the minimum value for a specific field within a result set.

| Parameter	| Type		| Default	| Description 							|
| :--------	| :-------- | :-----	| :------------------------------------	|
| field		| String	| Required	| The field to get the minimum value of	|
| alias		| String	| NULL		| Optional alias to rename field		|

**Examples**

```javascript
// SELECT SUM(`age`) FROM `users`
qb.select_sum('age').get('users',callback);
```

You can optionally include a second parameter to rename the resulting field

```javascript
// SELECT SUM(`age`) AS `sum_age` FROM `users`
qb.select_sum('age', 'sum_age').get('users',callback);
```

-------------

### FROM
#### .from(tables)

This SQL command is used to determine which sources, available to the active connection, to obtain data from.

| Parameter	| Type			| Default	| Description 									|
| :--------	| :------------ | :--------	| :--------------------------------------------	|
| tables	| String/Array	| N/A		| Table(s), view(s), etc... to grab data from	|

You can provide tables, views, or any other valid source of data in a comma-seperated list (string) or an array. When more than one data-source is provided when connected to a traditional RDMS, the tables will joined using a basic join. You can also `.from()` multiple times to get the same effect (the order in which they are called does not matter).

Aliases can be provided and they will be escaped properly.

***NOTE:*** You can also pass table/view names into the `.get()` and `.get_where()` methods and forego this method entirely.

**Examples**

***Basic***

```javascript
// SELECT `id`, `name`, `description` FROM `users`
qb.select('id,name,description').from('users').get(callback);
```

***Comma-Seperated***

```javascript
// SELECT `u`.`id`, `u`.`name`, `u`.`description`, `g`.`name` AS `group_name` 
// FROM (`users` `u`, `groups` `g`)
qb.select('u.id,u.name,u,description,g.name as group_name')
	.from('users u, groups g')
	.get(callback);
```

***Array of Tables***

```javascript
// SELECT `u`.`id`, `u`.`name`, `u`.`description`, `g`.`name` AS `group_name` 
// FROM (`users` `u`, `groups` `g`)
qb.select('u.id,u.name,u,description,g.name as group_name')
	.from(['users u', 'groups g'])
	.get(callback);
```

***Multiple From Calls***

```javascript
// SELECT `u`.`id`, `u`.`name`, `u`.`description`, `g`.`name` AS `group_name`
// FROM (`users` `u`, `groups` `g`)
qb.from('groups g').select('u.id,u.name,u,description,g.name as group_name')
	.from('users u')
	.get(callback);
```

-------------

### JOIN
#### .join(table,relation[,direction])

This SQL command is used query multiple tables related and connected by keys and get a single resultset.

| Parameter	| Type		| Default	| Description 												|
| :--------	| :--------	| :--------	| :--------------------------------------------------------	|
| table		| String	| Required	| The table or view to join to.								|
| relation	| String	| Required	| The "ON" statement that relates two tables together		|
| direction	| String	| "left"	| Direction of the join (see join types list below)			|

**Join Types/Directions**

* left
* right
* outer
* inner
* left outer
* right outer

The table/view and the relationship of it to the main table/view (see: `.from()`) must be specified. The specific type of join defaults to "left" if none is specified (althought it is recommened to always supply this value for readability). Multiple function calls can be made if you need several joins in one query. Aliases can (and should) be provided and they will be escaped properly.

**Examples**

If no direction is specified, "left" will be used:

```javascript
// SELECT `u`.`id`, `u`.`name`, `t`.`name` AS `type_name` 
// FROM `users` `u`
// LEFT JOIN `types` `t` ON `t`.`id`=`u`.`type_id`
qb.select('u.id,u.name,t.name as type_name').from('users u')
	.join('types t', 't.id=u.type_id')
	.get(callback);
```

You may specify a direction:

```javascript
// SELECT `u`.`id`, `u`.`name`, `t`.`name` AS `type_name` 
// FROM `users` `u`
// RIGHT OUTER JOIN `types` `t` ON `t`.`id`=`u`.`type_id`
qb.select('u.id,u.name,t.name as type_name').from('users u')
	.join('types t', 't.id=u.type_id', 'right outer')
	.get(callback);
```

Multiple function calls can be made if you need several joins in one query:

```javascript
// SELECT `u`.`id`, `u`.`name`, `t`.`name`  AS `type`, `l`.`name` AS `location`
// FROM `users` `u`
// LEFT JOIN `types` `t` ON `t`.`id`=`u`.`type_id`
// LEFT JOIN `locations` `l` ON `l`.`id`=`u`.`location_id`
var select = ['u.id', 'u.name', 't.name as type', 'l.name as location'];
qb.select(select).from('users u')
	.join('types t', 't.id=u.type_id', 'right outer')
	.join('locations l', 'l.id=u.location_id', 'left')
	.get(callback);
```

-------------

### WHERE

This SQL command is used to limit the resultset based on filters.

| Parameter		| Type			| Default	| Description 													|
| :------------	| :------------	| :--------	| :------------------------------------------------------------	|
| field/filters | String/Object	| Required	| A field name, a WHERE clause, or an object of key/value pairs |
| value			| Mixed			| N/A		| When the first parameter is a field name, this is the value	|
| escape		| Boolean		| TRUE		| TRUE: Escape field names and values; FALSE: No escaping		|

#### .where(field[,value[,escape]])

This method can be called in many different ways depending on your style and the format of the data that you have at the time of calling it. For standard SQL, all clauses will be joined with 'AND'&mdash;if you need to join clauses by 'OR', please us `.or_where()`. By default, all values and field names passed to this function will be escaped automatically to produce safer queries. You can turn this off by passing **false** into the third parameter.

If a valid field name is passed in the first parameter, you can pass an array the second parameter and the call will be treated as a [.where_in()](#where_in).

**Examples**

If you just want to pass a single filter at a time:

```javascript
// SELECT `galaxy` FROM `universe` WHERE `planet_name` = 'Earth'
qb.select('galaxy').where('planet_name', 'Earth').get('universe',callback);
```

If you need more complex filtering using different operators (`<, >, <=, =>, !=, <>, etc...`), you can simply provide that operator along with the key in the first parameter. The '=' is assumed if a custom operator is not passed:

```javascript
// SELECT `planet` FROM `planets` WHERE `order` <= 3
qb.select('planet').where('order <=',3).get('planets',callback);
```

You can conveniently pass an object of key:value pairs (which can also contain custom operators):

```javascript
// SELECT `planet` FROM `planets` WHERE `order` <= 3 AND `class` = 'M'
qb.select('planet').where({'order <=':3, class:'M'}).get('planets',callback);
```

You can construct complex WHERE clauses manually and they will be escaped properly as long as there are no paranthesis within it. *Please, for custom clauses containing subqueries, make sure you escape everything properly!* ***ALSO NOTE:*** with this method, there may be conflicts between database drivers!

```javascript
// SELECT `planet` FROM `planets` WHERE `order` <= 3 AND `class` = 'M'
qb.select('planet').where("order <= 3 AND class = 'M'").get('planets',callback);
```

You can pass a non-empty array as a value and that portion will be treated as a call to `.where_in()`:

```javascript
// SELECT `star_system` FROM `star_systems` 
// WHERE `planet_count` >= 4, `star` IN('Sun', 'Betelgeuse')
qb.select('star_system')
	.where({'planet_count >=': 4, star: ['Sun', 'Betelgeuse'])
	.get('star_systems',callback);
```

<a name="or_where"></a>
#### .or_where(field[,value[,escape]])

This method functions identically to [.where()](#where) except that it joins clauses with 'OR' instead of 'AND'.

```javascript
// SELECT `star_system` FROM `star_systems` 
// WHERE `star` = 'Sun' OR `star` = 'Betelgeuse'
qb.select('star_system').where('star', 'Sun')
	.or_where('star', 'Betelgeuse')
	.get('star_systems',callback);
```

<a name="where_in"></a>
#### .where_in(field,values[,escape])

This will create a "WHERE IN" statement in traditional SQL which is useful when you're trying to find rows with fields matching many different values... It will be joined with existing "WHERE" statements with 'AND'.

```javascript
// SELECT `star_system` FROM `star_systems` 
// WHERE `star` IN('Sun', 'Betelgeuse', 'Sirius', 'Vega', 'Alpha Centauri')
var stars = ['Sun', 'Betelgeuse', 'Sirius', 'Vega', 'Alpha Centauri'];
qb.select('star_system').where_in('star',stars).get('star_systems',callback);
```

<a name="or_where_in"></a>
#### .or_where_in(field,values[,escape])

Same as `.where_in()` except the clauses are joined by 'OR'.

```javascript
// SELECT `star_system` FROM `star_systems` 
// WHERE `planet_count` = 4 OR `star` IN('Sun', 'Betelgeuse')
var stars = ['Sun', 'Betelgeuse'];
qb.select('star_system').where('planet_count',4)
	.or_where_in('star',stars)
	.get('star_systems',callback);
```

<a name="where_not_in"></a>
#### .where_not_in(field,values[,escape])

Same as `.where_in()` except this generates a "WHERE NOT IN" statement. All clauses are joined with 'AND'.

```javascript
// SELECT `star_system` FROM `star_systems` 
// WHERE `star` NOT IN('Sun', 'Betelgeuse', 'Sirius', 'Vega', 'Alpha Centauri')
var stars = ['Sun', 'Betelgeuse', 'Sirius', 'Vega', 'Alpha Centauri'];
qb.select('star_system').where_not_in('star',stars).get('star_systems',callback);
```

<a name="or_where_not_in"></a>
#### .or_where_not_in(field,values[,escape])

Same as `.where_not_in()` except that clauses are joined with 'OR'.

```javascript
// SELECT `star_system` FROM `star_systems` 
// WHERE `star` NOT IN('Sun', 'Betelgeuse')
// OR `planet_count` NOT IN [2,4,6,8]
var stars = ['Sun', 'Betelgeuse'];
var planet_sizes = [2,4,6,8];
qb.select('star_system')
	.where_not_in('star',stars)
	.or_where_not_in('planet_size',planet_sizes)
	.get('star_systems',callback);
```

-------------

### LIKE

This SQL command is used to find close matches where as the "WHERE" command is for precise matches. This is useful for doing searches.

| Parameter		| Type			| Default 	| Description 										|
| :------------	| :------------	| :--------	| :------------------------------------------------	|
| field/filters | String/Object	| Required	| Field name or object of field/match pairs			|
| value			| String/Number	| Required	| The value you want the field to closely match		|
| side			| String		| 'both'	| before: '%value'; after: 'value%', both: '%value%'|

#### .like(field,match[,side])

All fields are escaped automatically, no exceptions. Multiple calls will be joined together with 'AND'. You can also pass an object of field/match pairs. Wildcard sides are interchangeable between before/left and after/right--choose the one that makes the most sense to you (there are examples of each below).

**Examples**

By default, the match string will be wrapped on both sides with the wildcard (%):

```javascript
// SELECT `first_name` FROM `users` WHERE `first_name` LIKE '%mber%'
// Potential results: [{first_name: 'Kimberly'},{first_name: 'Amber'}]
qb.select('first_name').like('first_name', 'mber').get('users',callback);
```

You can specify a side to place the wildcard (%) on if you'd like (before/left, after/right, both):

```javascript
// SELECT `first_name` FROM `users` WHERE `first_name` LIKE '%mber'
// Potential results: [{first_name: 'Amber'}]
qb.select('first_name').like('first_name', 'mber', 'before').get('users',callback);

// SELECT `first_name` FROM `users` WHERE `first_name` LIKE 'Kim%'
// Potential results: [{first_name: 'Kim'},{first_name: 'Kimberly'}]
qb.select('first_name').like('first_name', 'Kim', 'right').get('users',callback);
```

You can also pass 'none' if you don't want to use the wildcard (%)

```javascript
// SELECT `first_name` FROM `users` WHERE `first_name` LIKE 'kim'
// Potential results: [{first_name: 'Kim'}]
qb.select('first_name').like('first_name', 'kim', 'none').get('users',callback);
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
	.get('users',callback);
```

Or you can do it with an object of field/match pairs. If you want to pass a wildcard side, provide `null` as the second paramter and the side as the third. **Note**: All `match` values in an object will share the same wildcard side.

```javascript
// SELECT `first_name` FROM `users` 
// WHERE `first_name` LIKE '%ly'
// AND `middle_name` LIKE '%the'
// AND `last_name` LIKE '%is'
qb.select('first_name')
	.like({first_name: 'ly', middle_name: 'the', last_name: 'is'}, null, 'before')
	.get('users',callback);
```

<a name="or_like"></a>
#### .or_like(field,match[,side])

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
	.get('users',callback);
```

<a name="not_like"></a>
#### .not_like(field,match[,side])

This is exactly the same as the `.like()` method except that it creates "NOT LIKE" statements.

**Example**

```javascript
// SELECT `first_name` FROM `users` 
// WHERE `first_name` NOT LIKE 'A%'
// AND `middle_name` NOT LIKE 'B%'
// AND `last_name` NOT LIKE 'C%'
qb.select('first_name')
	.not_like({first_name: 'A', middle_name: 'B', last_name: 'C'}, null, 'after')
	.get('users',callback);
```

<a name="or_not_like"></a>
#### .or_not_like(field,match[,side])

This is exactly the same as the `.not_like()` method except that the clauses are joined by 'OR' not 'AND'.

**Example**

```javascript
// SELECT `first_name` FROM `users` 
// WHERE `first_name` NOT LIKE 'A%'
// OR `middle_name` NOT LIKE 'B%'
// OR `last_name` NOT LIKE 'C%'
qb.select('first_name')
	.or_not_like({first_name: 'A', middle_name: 'B', last_name: 'C'}, null, 'after')
	.get('users',callback);
```

-------------

### GROUP BY
#### .group_by(fields)

This SQL command allows you to get the first (depending on ORDER) result of a group of results related by a shared value or values.

| Parameter	| Type			| Default	| Description 							|
| :--------	| :------------	| :-------	| :------------------------------------	|
| field(s)	| String/Object	| Required	| Field name or array of field names	|

**Examples**

Group by a single field:

```javascript
// SELECT * FROM `users` GROUP BY `department_id`
qb.group_by('department_id').get('users',callback);
```

Group by multiple fields:

```javascript
// SELECT * FROM `users` GROUP BY `department_id`, `position_id`
qb.group_by(['department_id', 'position_id']).get('users',callback);
```

-------------

### HAVING
#### .having(field,value)

This SQL command is similar to the 'WHERE' command but is used when aggregate functions are used in the "SELECT" portion of the query.

| Parameter		| Type			| Default	| Description 												|
| :--------		| :------------	| :--------	| :-----------------------------------------------------	|
| field/filters	| String/Object	| Required	| Field name or object of field/value pairs to filter on	|
| value			| Mixed			| NULL		| Value to filter by										|
| escape		| Boolean		| true		| TRUE: Escape fields and values; FALSE: Don't escape.		|

This method works exactly the same way as the `.where()` method works with the exception of the fact that there is no 'HAVING' equivalent to 'WHERE IN'. See the [.where()](#where) documentation if you need additional information.

**Examples**

If you just want to add a single having clause:

```javascript
// SELECT COUNT(*) AS `num_planets` FROM `star_systems` 
// GROUP BY `id`
// HAVING `num_planets` = 5
qb.group_by('id').having('num_planets',5).count('star_systems',callback);
```

If you need more complex filtering using different operators (`<, >, <=, =>, !=, <>, etc...`), you can simply provide that operator along with the key in the first parameter. The '=' is assumed if a custom operator is not passed:

```javascript
// SELECT COUNT(*) AS `num_planets` FROM `star_systems` 
// GROUP BY `id`
// HAVING `num_planets` > 5
qb.group_by('id').having('num_planets >',5).count('star_systems',callback);
```

You can conveniently pass an object of key:value pairs (which can also contain custom operators):

```javascript
// SELECT COUNT(*) AS `num_planets` FROM `star_systems` 
// GROUP BY `id`
// HAVING `num_planets` > 5
qb.group_by('id').having({'num_planets >': 5}).count('star_systems',callback);
```

You can construct complex WHERE clauses manually and they will be escaped properly. *Please, for custom clauses containing subqueries, make sure you escape everything properly!* ***ALSO NOTE:*** with this method, there may be conflicts between database drivers!

```javascript
// SELECT COUNT(*) AS `num_planets` FROM `star_systems` 
// GROUP BY `id`
// HAVING `num_planets` > (5+2)
qb.group_by('id').having("`num_planets` > (5+2)",null,false).count('star_systems',callback);
```

<a name="or_having"></a>
#### .or_having(field[,value[,escape]])

This method functions identically to [.having()](#having) except that it joins clauses with 'OR' instead of 'AND'.

```javascript
// SELECT SUM(planets) AS `num_planets`, SUM(moons) AS `num_moons` FROM `star_systems` 
// GROUP BY `id`
// HAVING `num_planets` >= 5 OR `num_moons` <= 10
qb.group_by('id')
	.having('num_planets >=',5)
	.or_having('num_moons <=', 10)
	.count('star_systems',callback);
```

-------------

### ORDER BY
#### .order_by(field[,direction])

This SQL command is used to order the resultset by a field or fields in descending, ascending, or random order(s).

| Parameter	| Type			| Default 	| Description 																|
| :--------	| :------------	| :--------	| :------------------------------------------------------------------------ |
| fields	| String/Array	| Required	| Field name or an array of field names, possibly with directions as well	|
| direction	| String		| 'asc'		| 'asc': Ascending; 'desc': Descending; 'rand'/'random'/'rand()': Random.	|

This is a very flexible method, offerring a wide variety of ways you can call it. Variations include:

* Pass the field name and ommit the direction
* Pass the field name and the direction as the first and second parameters, respectively (most common)
* Pass an array of fields to first paramter, direction to second parameter.
* Pass an array of fields + directions in first parameter and ommit the second one.
* Pass an array of fields (+ directions for some to override second parameter) to first paramter, direction to second parameter.
* Pass a raw comma-seperated string of field + directions in first parameter and ommit the second one.

**Examples**

Pass the field name and ommit the direction

```javascript
// SELECT * FROM `galaxies` ORDER BY `galaxy_name` ASC
qb.order_by('galaxy_name').get('galaxies',callback);
```

Pass the field name and the direction as the first and second parameters, respectively

```javascript
// SELECT * FROM `galaxies` ORDER BY `galaxy_name` DESC
qb.order_by('galaxy_name', 'desc').get('galaxies',callback);
```

Pass an array of fields to first paramter, direction to second parameter

```javascript
// SELECT * FROM `galaxies` ORDER BY `galaxy_name` DESC, `galaxy_size` DESC
qb.order_by(['galaxy_name', 'galaxy_size'],'desc').get('galaxies',callback);
```

Pass an array of fields + directions in first parameter and ommit the second one.

```javascript
// SELECT * FROM `galaxies` ORDER BY `galaxy_name` DESC, `galaxy_size` ASC
qb.order_by(['galaxy_name desc', 'galaxy_size asc']).get('galaxies',callback);
```

Pass an array of fields (+ directions for some to override second parameter) to first paramter, direction to second parameter

```javascript
// SELECT * FROM `galaxies` ORDER BY `galaxy_name` DESC, `galaxy_size` ASC
qb.order_by(['galaxy_name desc', 'galaxy_size'],'asc').get('galaxies',callback);
```

Pass a raw comma-seperated string of field + directions in first parameter and ommit the second one.

```javascript
// SELECT * FROM `galaxies` ORDER BY `galaxy_name` ASC, `galaxy_size` DESC
qb.order_by('galaxy_name asc, galaxy_size desc').get('galaxies',callback);
```

-------------

### LIMIT
#### .limit(limit_to,offset)

This SQL command is used to limit a result set to a maximum number of results, regardless of the actual number of results that might be returned by a non-limited query.

| Parameter	| Type		| Default 	| Description 											|
| :--------	| :--------	| :--------	| :----------------------------------------------------	|
| limit_to	| Integer	| Required	| The maximum number of results you want from the query	|
| offset	| Integer	| NULL		| Optional offset value (where to start before limiting)|

**Example**

```javascript
// SELECT * FROM `users` LIMIT 5
qb.limit(5).get('users',callback);
```

You can provide an option offset value instead of calling [.offset()](#offset) seperately:

```javascript
// SELECT * FROM `users` LIMIT 5, 5
qb.limit(5,5).get('users',callback);
```

-------------

### OFFSET
#### .offset(offset)

This SQL command is tell the "LIMIT" where to start grabbing data. If cannot be used without a limit having been set first.

| Parameter	| Type		| Default	| Description 						|
| :--------	| :--------	| :-----	| :-----------------------------	|
| offset	| Integer	| NULL		| where to start before limiting	|

The practical uses of this method are probably miniscule since the `.limit()` method must be called in order to use it and the limit method provides a means by which to set the offset. In any case, the method is very simple: pass the result row index that you want to start from when limiting. This is most useful for pagination of search results and similar scenarios.

**Example**

```javascript
// SELECT * FROM `users` LIMIT 5, 25
qb.limit(5).offset(25).get('users',callback);
```

-------------

Execution Methods
-----------------

| API Method						| SQL Command	| MySQL		| MSSQL	| Oracle	| SQLite	| Postgres	| Mongo	|
| :--------------------------------	| :------------	| :-------:	| :---:	| :-------:	| :-------:	| :-------:	| :---:	|
| [query()](#query)					| N/A			| &#x2713;	|		|			|			|			|		|
| [get()](#get)						| N/A			| &#x2713;	|		|			|			|			|		|
| [get_where()](#get_where)			| N/A			| &#x2713;	|		|			|			|			|		|
| [count()](#count)					| COUNT			| &#x2713;	|		|			|			|			|		|
| [update()](#update)				| UPDATE 		| &#x2713;	|		|			|			|			|		|
| [update_batch()](#update_batch)	| N/A			| &#x2713;	|		|			|			|			|		|
| [insert()](#insert)				| INSERT 		| &#x2713;	|		|			|			|			|		|
| [insert_batch()](#insert_batch)	| N/A			| &#x2713;	|		|			|			|			|		|
| [insert_ignore()](#insert-ignore)	| INSERT IGNORE	| &#x2713;	|		|			|			|			|		|
| [delete()](#delete)				| DELETE		| &#x2713;	|		|			|			|			|		|

### What are "Execution Methods"??

Execution methods are the end-of-chain methods in the QueryBuilder library. Once these methods are called, all the chainable methods you've called up until this point will be compiled into a query string and sent to the driver's `query()` method. At this point, the QueryBuilder will be reset and ready to build a new query. The database driver will respond positively with resultset/boolean depending on the type of query being executed or negatively with an error message. Both (if provided) will be supplied to the callback function.

### Handling Error Messages and Results

The final parameter of every execution method will be a callback function. The parameters for the callback are in the `node.js` standard `(err, response)` format. When you working with `pool` and `cluster` type connections, a third paramter will be passed containing the `connection` object&mdash;you would use this to release the connection when you're done with it. If the driver throws an error, a javascript `Standard Error` object will be passed into the `err` parameter. The `response` parameter can be supplied with an array of result rows (`.get()` & `.get_where()`), an integer (`.count()`), or a response object containing rows effected (all others) in any other scenario.


#### Callback Example

```javascript
var callback =  function(err, response, connection) {
	connection.release(); // if you're working with a pool or cluster...
	if (err) {
		console.error(err);
	} else {
		for (var i in response) {
			var row = response[i];
			/*
				Do something with each row...
			*/
		}
	}
};
qb.get('foo',callback);
```

-------------

### .query(query_string,callback)

| Parameter		| Type		| Default	| Description										|
| :--------		| :--------	| :-----	| :------------------------------------------------ |
| query_string	| String	| Required	| Query to send directly to your database driver	|
| callback		| Function	| Required	| What to do when the driver has responded			|

*****This method bypasses the entire QueryBuilder portion of this module***** is simply uses your database driver's native querying method. You should be cautious when using this as none of this module's security and escaping functionality will be utilized.

There are scenarios when using this method may be required; for instance, if you need to run a very specific type of command on your database that is not typical of a standard, CRUD-type query (ex. user permissions or creating a view).

**Example**

```javascript
var sql = qb.select(['f.foo', 'b.bar'])
	.from('foo f')
	.join('bar b', 'b.foo_id=f.id', 'left')
	.get_compiled_select();
qb.query("CREATE VIEW `foobar` AS " + sql, callback);
```

-------------

### .get(table,callback)

| Parameter	| Type		| Default	| Description													|
| :--------	| :--------	| :-----	| :------------------------------------------------------------ |
| table		| String	| undefined	| (optional) Used to avoid having to call `.from()` seperately.	|
| callback	| Function	| Required	| What to do when the driver has responded						|

This method is used when running queries that might respond with rows of data (namely, "SELECT" statements...). You can pass a table name as the first parameter to avoid having to call [.from()](#from) seperately. If the table name is omitted, and the first paramter is a callback function, there will be no need to pass a callback function into the second parameter.

**Type of Response**

Array of rows

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
 * 	`g`.`name`, 
 *	`g`.`diameter`,
 *	`g`.`type_id`, 
 *	`gt`.`name` AS `type`, 
 *	COUNT(`s`.`id`) as `num_stars`
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
	.get(function(err, response) {
		if (err) return console.error(err);
		
		for (var i in response) {
			var row = response[i];
			console.log("The " + row.name + " is a " + row.diameter 
				+ " lightyear-wide " + row.type + " galaxy with " 
				+ row.num_stars + " stars.");
		}
	});
```

-------------

### .get_where(table,where,callback)

| Parameter	| Type		| Default	| Description													|
| :--------	| :--------	| :-----	| :------------------------------------------------------------ |
| table		| String	| Required	| (optional) Used to avoid having to call `.from()` seperately.	|
| where		| Object	| Required	| (optional) Used to avoid having to call `.where()` seperately	|
| callback	| Function	| Required	| What to do when the driver has responded.						|

This method is basically the same as the `.get()` method except that if offers an additional shortcut parameter to provide a list of filters (`{field_name:value}`)  to limit the results by (effectively a shortcut to avoid calling `.where()` seperately). The other difference is that *all* parameters are required and they must be in the proper order.

**Type of Response**

Array of rows

**Examples**

Basic example:

```javascript
// SELECT * FROM `galaxies` WHERE `num_stars` > 100000000
qb.get('galaxies', {'num_stars >': 100000000}, callback);
```

You can still provide other where statements if you want&mdash;they'll all work hapilly together:

```javascript
// SELECT * FROM `galaxies` WHERE `num_stars` > 100000000 AND `galaxy_type_id` = 3
qb.where('num_stars >', 100000000).get_where('galaxies', {galaxy_type_id: 3}, callback);
```

-------------

### .count(table,callback)

| Parameter	| Type		| Default	| Description													|
| :--------	| :--------	| :-----	| :------------------------------------------------------------ |
| table		| String	| Required	| (optional) Used to avoid having to call `.from()` seperately.	|
| callback	| Function	| Required	| What to do when the driver has responded.						|

This method is used to determine the total number of results that a query would return without actually returning the entire resultset back to this module. Obviously, you could simply execute the same query with `.get()` and then check the `length` property of the response array, but, that would take significantly more time and memory for very large resultsets.

**Type of Response**

Integer

**Examples**

```javascript
// SELECT COUNT(*) AS `count` FROM `galaxies` WHERE `type` = 3
var type = 3;
qb.where('type',type).count('galaxies', function(err, count) {
	if (err) return console.error(err);
	console.log("There are " + count + " Type " + type + " galaxies in the Universe.");
});
```

-------------

### .update(table,data,where,callback)

| Parameter	| Type		| Default	| Description													|
| :--------	| :--------	| :-----	| :------------------------------------------------------------ |
| table		| String	| Required	| The table/collection you'd like to update						|
| data		| Object	| Required	| The data to update (ex. {field: value})						|
| where		| Object	| undefined	| (optional) Used to avoid having to call `.where()` seperately	|
| callback	| Function	| Required	| What to do when the driver has responded.						|

This method is used to update a table (SQL) or collection (NoSQL) with new data. All identifiers and values are escaped automatically when applicable. The response parameter of the callback should receive a response object with information like the number of records updated, and the number of changed rows...

**Type of Response**

Object containing infomration about the results of the query.

**Examples**

Here's a contrived example of how it might be used in an app made with the Express framework:

```javascript
var express = require('express');
var app = express();
var settings = require('db.json');
var qb = require('node-querybuilder').QueryBuilder(settings,'mysql', 'pool');

app.post('/update_account', function(req, res) {
	var user_id = req.session.user_id;
	var data = {
		first_name: sanitize_name(req.body.first_name),
		last_name: sanitize_name(req.body.last_name),
		age: sanitize_age(req.body.last_name),
		bio: sanitize_bio(req.body.bio),
	};
	
	qb.update('users', data, {id:user_id}, function(err, res, connection) {
		connection.release();
		if (err) return console.error(err);
		
		var page_data = {
			prefill: data,
		}
		return res.render('/account_updated', page_data);
	});
});
```

-------------

### .update_batch(table,dataset,where,callback)

-------------

### .insert(table,data,callback)

-------------

### .insert_batch(table,dataset,callback)

-------------

### .insert_ignore(table,data,callback)

-------------

### .delete(table,where,callback)

-------------

Other Library-Specifc Methods
-----------------------------

These are methods that aren't part of the query-building chain, but, rather, methods you might call before, after, or during (but not as part of) building a query.

| API Method									| MySQL		| MSSQL	| Oracle	| SQLite	| Postgres	| Mongo	|
| :--------------------------------------------	| :-------:	| :---:	| :-------:	| :-------:	| :-------:	| :---:	|
| [get_connection()](#get_connection)			| &#x2713;	| 		|			|			|			|		|
| [last_query()](#last_query)					| &#x2713;	| 		|			|			|			|		|
| [escape()](#escape)							| &#x2713;	| 		|			|			|			|		|
| [get_compiled_select()](#get_compiled_select)	| &#x2713;	| 		|			|			|			|		|
| [get_compiled_insert()](#get_compiled_insert)	| &#x2713;	| 		|			|			|			|		|
| [get_compiled_update()](#get_compiled_update)	| &#x2713;	| 		|			|			|			|		|
| [get_compiled_delete()](#get_compiled_delete)	| &#x2713;	| 		|			|			|			|		|


### .get_connection(callback)

Used to get a new connection from the connection pool or cluster pool.

-------------

### .last_query()

-------------

### .escape(value)

-------------

### .get_compiled_select()

-------------

### .get_compiled_insert()

-------------

### .get_compiled_update()

-------------

### .get_compiled_delete()

-------------

Contribute
==========

Got a missing feature you'd like to use? Found a bug? Go ahead and fork this repo, build the feature and issue a pull request.
