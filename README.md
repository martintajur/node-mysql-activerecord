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

We'll call this `db.json` (you can also just have a normal javascript object directly within your code somwhere if you're risky like that).

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
	* This will use the driver's basic single connection capabilities. All connections to your app will use this single database connection. This is usually less than ideal for most web applications buy might be quite suitable for command line scripts and the like. 
	* **All drivers must have this connection type**.
* pool
	* This will utilize the driver's connection pooling capabilities if it is provided. Connection pooling allows your application to pull from a pool of connections that were created by the driver. Typically the connections will be handed out to requesting methods in a round-robin fashion. This is ideal for a web application.
* cluster
	* When you have a cluster of servers and you want to create pools of connections to different servers to help load balance your stack, using the `cluster` connection type can come in handy.

**Note:**
You will specify the type of connection as the third parameter to the contructor

**Example:**

```javascript
var qb = require('node-querybuilder').QueryBuilder(settings, 'mysql', 'pool');
```


API Methods
===============================

 * SELECT
 * DISTINCT
 * FROM
 * IN
 * MIN
 * MAX
 * AVG
 * SUM
 * UPDATE
 * INSERT (single-row and multi-row)
 * INSERT IGNORE
 * DELETE
 * JOIN
 * LIMIT and OFFSET
 * ORDER BY
 * GROUP BY
 * COUNT
 * HAVING

Methods
-------

### SELECT

This method is used to specify the fields to pull into the resultset when running SELECT-like queries.

| Parameter	| Type			| Default 	| Description 									|
| :--------	| :-------- 	| :-----  	| :-------------------------------------------- | 
| fields 	| String|Array	| N/A 		| The fields in which to grab from the database |
| escape 	| Boolean		| true 		| TRUE: auto-escape fields; FALSE: don't escape |


#### .select(fields)

The fields provided to this method will be automatically escaped by the database driver. The `fields` paramter can be passed in 1 of 2 ways:

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
// SELECT MAX(id) as `max_id`
qb.select('MAX(id) as `max_id`',false);
```

Contribute
==========

Got a missing feature you'd like to use? Found a bug? Go ahead and fork this repo, build the feature and issue a pull request.
