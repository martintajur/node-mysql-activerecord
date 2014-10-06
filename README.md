Universal QueryBuilder for Node.js
======================================

Node-QueryBuilder is an ambitious attempt to create a kind of "universal translator" which provides programmers a consistent API to connect to and query *any* database (traditional and NoSQL) supported by the module. The module is highly extensible and, in theory, can suppport any database provided that the driver has been written for it.

The API of this module very closely mimics Codeigniter's Active Record (now called "Query Builder") library and much of the code has been directly translated from the PHP libraries in Codeigniter to JavaScript. A lot of credit needs to go to he folks over at EllisLab (https://ellislab.com/codeigniter) and all the contributors to the Codeigniter project (of which I am one): https://github.com/EllisLab/CodeIgniter/

The primary benefits of this module (currently) are:

 * Ability to write queries agnostically to the database you intend to query
 * Supports all basic database commands (insert, update, delete, select, etc...)
 * Extend commands from the most popular native database drivers in NPM.
 * Supports method chaining
 * Automatically escapes field values
 * Is fully unit tested
 * Allows for greater flexibility and more control over a full ORM
 * Ligher-weight than an ORM
 * Allows you to drop down to the native methods of your driver if you choose
 * Allows for different drivers for different versions (SQLite 2 vs SQLite 3)
 * The order in which you call the methods is irrelevant except for the execution methods (get, insert, update, delete) which must be called last.
 
Database Drivers 
=================

Currently Written:
------------------
* MySQL
 
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

Licence Info
============

Licensed under the GPL license and MIT:

* http://www.opensource.org/licenses/GPL-license.php
* http://www.opensource.org/licenses/mit-license.php

Quick Example
=============

```javascript
var settings = {
	host: 'localhost',
	database: 'mydatabase',
	user: 'myuser',
	password: 'MyP@ssw0rd'
};
var qb = require('node-querybuilder').QueryBuilder(settings, 'mysql', 'standard');

qb.select('name','position').where({type: 'rocky', 'diameter <': 12000}).get('planets', function(err,rows) {
	if (err) console.error("Uh oh! Couldn't get results: " + err.msg);
	
	// SELECT `name`, `position` FROM `planets` WHERE `type` = 'rocky' AND `diameter` < 12000
	console.log("Query Ran: " + qb.last_query());
	
	// [{name: 'Mercury', position: 1}, {name: 'Mars', position: 4}]
	console.dir(rows);
});
```

Connecting to Your Database
===========================

Quick Reference
---------------

| Driver    | Default | Active 	| standard 	| pool | cluster | Additional Connection Options						    |
| :--------	| :------ | :----- 	| :------- 	| :--- | :------ | :------------------------------------------------------- | 
| mysql	 	| X       | Yes    	| Yes		| Yes  | Yes	 | https://github.com/felixge/node-mysql#connection-options |
| mssql	 	|         | No  	| Yes		| ???  | ???	 | 														    |
| sqlite 	|         | No  	| Yes		| ???  | ???	 | 														    |
| oracle 	|         | No  	| Yes		| ???  | ???	 | 														    |
| postgres	|         | No  	| Yes		| ???  | ???	 | 														    |
| mongodb	|         | No	 	| Yes		| ???  | ???	 | 														    |


Standard Connection Settings
----------------------------

The options listed below are available for all database drivers. Additional properties may be passed if the driver of the database you are connecting to supports them. See the "Additional Connection Options" column above for a link to the a specific driver's connection options documentation.

| Option	| Default 	| Description 									|
| :--------	| :-----  	| :-------------------------------------------- | 
| host	 	| localhost | The server you're connecting to				|
| user	 	| NULL 	  	| The database user 							|
| password 	| NULL 	  	| The database `user`'s password				|
| database 	| NULL 	  	| The database to connect to					|
| pool_size	| 10 	  	| Max connections for `pool` connection type	|

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

* standard (default)
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
===============================

SQL Commands
-------------

| SQL Command		| API Method						| Notes 						|
| :------------		| :----------------					| :---- 						|
| SELECT			| [select()](#select)				|								|
| DISTINCT 			| [distinct()](#distinct)			|								|
| MIN 				| [select_min()](#select_min)		|								|
| MAX 				| [select_max()](#select_max)		|								|
| AVG 				| [select_avg()](#select_avg)		|								|
| SUM 				| [select_sum()](#select_sum)		|								|
| FROM 				| [from()](#from)					|								|
| JOIN				| [join()](#join)					|								|
| WHERE 			| [where()](#where)					|								|
| IN 				| [where_in()](#where_in)			|								|
| GROUP BY			| [group_by()](#group_by)			|								|
| HAVING			| [having()](#having)				|								|
| ORDER BY			| [order_by()](#order_by)			|								|
| LIMIT				| [limit()](#limit)					|								|
| OFFSET			| [offset()](#offset)				|								|
| COUNT				| [count()](#count)					|								|
| SET				| [set()](#set)						|								|
| UPDATE 			| [update()](#update)				|								|
| INSERT 			| [insert()](#insert)				| single-row and multi-row		|
| INSERT IGNORE		| [insert_ignore()](#insert_ignore)	|								|
| DELETE			| [delete()](#delete)				|								|

Library-Specific Methods
------------------------

* get()
* count_all()
* get_where()
* where_not_in()
* or_where()
* or_where_in()
* or_where_not_in()
* or_like()
* or_not_like()
* not_like()
* or_having()
* count_all_results()
* insert_batch()
* update_batch()
* query()
* last_query()


### SELECT

This method is used to specify the fields to pull into the resultset when running SELECT-like queries.

| Parameter	| Type			| Default 	| Description 									|
| :--------	| :-------- 	| :-----  	| :-------------------------------------------- | 
| fields 	| String/Array	| N/A 		| The fields in which to grab from the database |
| escape 	| Boolean		| true 		| TRUE: auto-escape fields; FALSE: don't escape |


#### .select(fields)

The fields provided to this method will be automatically escaped by the database driver. The `fields` paramter can be passed in 1 of 2 ways (field names will be trimmed in either scenario):

* String with fields seperated by a comma:
	* `.select('foo, bar, baz')`
* Array of field names
	* `.select(['foo','bar','baz'])`
	
**Examples**

```javascript
// SELECT `foo`, `bar`, `baz`
qb.select(['foo','bar','baz']);
```

You can chain the method together using different patterns if you want:

```javascript
// SELECT `foo`, `bar`, `baz`, `this`, `that`, `the_other`
qb.select(['foo','bar','baz']).select('this,that,the_other');
```

You can alias your field names and they will be escaped properly as well:

```javascript
// SELECT `foo` as `f`, `bar` as `b`, `baz` as `z`
qb.select(['foo as f','bar as b','baz as z']);
```

#### .select(fields,escape)

You can optionally choose not to have the driver auto-escape the fieldnames (dangerous, but useful if you a function in your select statement, for instance):

**Example**

```javascript
// SELECT MAX(id) AS `max_id`
qb.select('MAX(id) AS `max_id`',false);
```

***NOTE:*** This example is contrived and can be achieved more-easily using the `.select_max()` method described below.

### DISTINCT

This SQL command is used to prevent duplicate rows from being returned in the resultset at the database level.

***This method takes no parameters***

#### .distinct()

This should only be used when querying data (execution method: get()/get_where()) (not inserting, updating or removing). If it's provided to another execution method, it will simply be ignored.

**Example**

```javascript
// SELECT DISTINCT `id`, `name`, `description` FROM `users`
qb.distinct().select('id,name,description').get('users',callback);
```

### MIN

This SQL command is used to find the minimum value for a specific field within a resultset.

| Parameter	| Type		| Default 	| Description 							|
| :--------	| :-------- | :-----  	| :-------------------------------------| 
| field 	| String	| Required	| The field to get the minimum value of |
| alias 	| String	| NULL 		| Optional alias to rename field		|

#### .select_min(field)

**Examples**

```javascript
// SELECT MIN(`age`) FROM `users`
qb.select_min('age').get('users',callback);
```

You can optionally include a second parameter to rename the resulting field

```javascript
// SELECT MIN(`age`) AS `min_age` FROM `users`
qb.select_min('age','min_age').get('users',callback);
```

### MAX

This SQL command is used to find the maximum value for a specific field within a resultset.

| Parameter	| Type		| Default 	| Description 							|
| :--------	| :-------- | :-----  	| :-------------------------------------| 
| field 	| String	| Required	| The field to get the maximum value of |
| alias 	| String	| NULL 		| Optional alias to rename field		|

#### .select_max(field)

**Examples**

```javascript
// SELECT MAX(`age`) FROM `users`
qb.select_max('age').get('users',callback);
```

You can optionally include a second parameter to rename the resulting field

```javascript
// SELECT MAX(`age`) AS `max_age` FROM `users`
qb.select_max('age','max_age').get('users',callback);
```

### AVG

This SQL command is used to find the average value for a specific field within a resultset.

| Parameter	| Type		| Default 	| Description 							|
| :--------	| :-------- | :-----  	| :-------------------------------------| 
| field 	| String	| Required	| The field to get the average value of |
| alias 	| String	| NULL 		| Optional alias to rename field		|

#### .select_avg(field)

**Examples**

```javascript
// SELECT AVG(`age`) FROM `users`
qb.select_avg('age').get('users',callback);
```

You can optionally include a second parameter to rename the resulting field

```javascript
// SELECT AVG(`age`) AS `avg_age` FROM `users`
qb.select_avg('age','avg_age').get('users',callback);
```


### SUM

This SQL command is used to find the minimum value for a specific field within a result set.

| Parameter	| Type		| Default 	| Description 							|
| :--------	| :-------- | :-----  	| :-------------------------------------| 
| field 	| String	| Required	| The field to get the minimum value of |
| alias 	| String	| NULL 		| Optional alias to rename field		|

#### .select_sum(field)

**Examples**

```javascript
// SELECT SUM(`age`) FROM `users`
qb.select_sum('age').get('users',callback);
```

You can optionally include a second parameter to rename the resulting field

```javascript
// SELECT SUM(`age`) AS `sum_age` FROM `users`
qb.select_sum('age','sum_age').get('users',callback);
```

### FROM

This SQL command is used to determine which sources, available to the active connection, to obtain data from.

| Parameter	| Type			| Default 	| Description 									|
| :--------	| :-------- 	| :-----  	| :-------------------------------------------- | 
| tables 	| String/Array	| N/A 		| Table(s), view(s), etc... to grab data from 	|

#### .from(tables)

You can provide tables, views, or any other valid source of data in a comma-seperated list (string) or an array. When more than one data-source is provided when connected to a traditional RDMS, the tables will joined using a basic join. You can also `.from()` multiple times to get the same effect (the order in which they are called does not matter).

Aliases can be provided and they will be escaped properly.

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

### JOIN

This SQL command is used query multiple tables related and connected by keys and get a single resultset.

| Parameter	| Type		| Default 	| Description 												|
| :--------	| :-------- | :-----  	| :--------------------------------------------------------	| 
| table 	| String	| Required	| The table or view to join to.								|
| relation 	| String	| Required	| The "ON" statement that relates to table together			|
| direction	| String	| "left"	| Direction of the join (see join types list below)			|

**Join Types**

* left
* right
* outer
* inner
* left outer
* right outer


#### .join(table,relation)

The table/view and the relationship of it to the main table/view (see: `.from()`) must be specified. The specific type of join defaults to "left" if none is specified (althought it is recommened to always supply this value for readability). Multiple function calls can be made if you need several joins in one query. Aliases can (and should) be provided and they will be escaped properly.

**Examples**

If no direction is specified, "left" will be used:

```javascript
// SELECT `u`.`id`, `u`.`name`, `t`.`name` AS `type_name` 
// FROM `users` `u`
// LEFT JOIN `types` `t` ON `t`.`id`=`u`.`type_id`
qb.select('u.id,u.name,t.name as type_name').from('users u')
	.join('types t','t.id=u.type_id')
	.get(callback);
```

You may specify a direction:

```javascript
// SELECT `u`.`id`, `u`.`name`, `t`.`name` AS `type_name` 
// FROM `users` `u`
// RIGHT OUTER JOIN `types` `t` ON `t`.`id`=`u`.`type_id`
qb.select('u.id,u.name,t.name as type_name').from('users u')
	.join('types t','t.id=u.type_id','right outer')
	.get(callback);
```

Multiple function calls can be made if you need several joins in one query:

```javascript
// SELECT `u`.`id`, `u`.`name`, `t`.`name`  AS `type`, `l`.`name` AS `location`
// FROM `users` `u`
// LEFT JOIN `types` `t` ON `t`.`id`=`u`.`type_id`
// LEFT JOIN `locations` `l` ON `l`.`id`=`u`.`location_id`
var select = ['u.id','u.name','t.name as type','l.name as location'];
qb.select(select).from('users u')
	.join('types t','t.id=u.type_id','right outer')
	.join('locations l','l.id=u.location_id','left')
	.get(callback);
```

Contribute
==========

Got a missing feature you'd like to use? Found a bug? Go ahead and fork this repo, build the feature and issue a pull request.
