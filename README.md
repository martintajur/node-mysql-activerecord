**Note from author: I don't actively maintain this repository anymore. Huge thanks to Kyle Farris who has a more actively maintained version of the same thing available at (https://github.com/kylefarris/node-querybuilder) Please use that instead.**

MySQL ActiveRecord Adapter for Node.js
======================================

Query builder on top of node-mysql module (https://github.com/felixge/node-mysql).

[![npm version](https://badge.fury.io/js/mysql-activerecord.svg)](https://badge.fury.io/js/mysql-activerecord)

To me, the main benefit of  is the ability to direct JavaScript objects straight to MySQL query components without having to worry about constructing the query itself. Although this query builder is a tiny step towards an ORM, I see a lot of value in the query builder as it allows more control over database queries than traditional ORM where queries are hidden behind the business logic and may become executed in an unoptimized way. (It is named after a popular PHP framework CodeIgniter's "Active Record" class, and thus the whole library does not have much in common with the active record pattern as such.)

This query builder is
 
 * Light-weight
 * Supports all basic MySQL commands
 * Supports method chaining
 * Automatically escapes field values
 * Has no dependencies (it already includes the node-mysql module)
 * Supports raw queries

How to install
==============
```bash
npm install mysql-activerecord --save
```


Get started
-----------
```js
var Db = require('mysql-activerecord');
var db = new Db.Adapter({
	server: 'localhost',
	username: 'root',
	password: '12345',
	database: 'test',
	reconnectTimeout: 2000
});
```

 * `server`: the IP address or hostname to connect to
 * `username`: MySQL username to connect with
 * `password`: MySQL password to connect with
 * `database`: database to switch to initially (optional). If omitted, no database will be selected.
 * `port`: which port to connect to (optional). If omitted, 3306 will be used.
 * `reconnectTimeout`: milliseconds after which to try to reconnect to the MySQL server if a disconnect happens (optional). If omitted, the default value of 2000 will be used. If set to `false`, no reconnecting will take place.

Support of MySQL commands
=========================

 * SELECT
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
=======

# .select()

## .select(selectFieldName)
Specifies the field(s) to use in the SELECT query as a atring.
```js
db.select("id, CONCAT(first_name, ' ', last_name) as full_name, email");
// This would produce: SELECT id, CONCAT(first_name, ' ', last_name) as full_name, email …
```

You can call .select() multiple times within the scope of one query — all parameters will be used in the final query. E.g.
```js
db.select('id');
// do some advanced checking and calculations here (only synchronous work, though!)
db.select('first_name, last_name');
// This would procude: SELECT id, first_name, last_name …
```

## .select([selectFieldName, selectFieldName, … ])
Same as above, with a difference of taking in fields list as an array.
```js
db.select(['id', 'first_name', 'last_name']);
// This would produce: SELECT id, first_name, last_name …
```

# .where()

## .where(rawClause)
Specifies a where clause component.
```js
db.where('add_time is null');
// This would produce: … WHERE add_time is null …
```

You can call .where() multiple times within the scope of one query — all parameters will be used in the final query.

## .where(fieldName, [possibleWhereInValue, possibleWhereInValue])
Specifies a WHERE IN structure to use in the query.
```js
db.where('first_name', ['John', 'Maria', 'Jason', 'Herbert']);
// This would produce: … WHERE first_name in ('John', 'Maria', 'Jason', 'Herbert') …
```

## .where(fieldName, fieldValue)
Specifies a single WHERE condition to use in the query.
```js
db.where('first_name', 'John');
// This would produce: … WHERE first_name = 'John' …
```

## .where({ fieldName: fieldValue, fieldName: fieldValue, … })
Specifies multiple WHERE conditions to use in the query.
```js
var conditions = {
	first_name: 'John',
	last_name: 'Smith'
};
db.where(conditions);
// This would produce: … WHERE first_name = 'John' AND last_name = 'Smith' …
```

# .order_by()

## .order_by(orderByCondition)
Specifies the ORDER BY condition as a full string.
```js
db.order_by('name asc');
// This would produce: … ORDER BY name asc …
```

You can call .order_by() multiple times within the scope of one query — all parameters will be used in the final query.

## .order_by([orderByCondition, orderByCondition, … ])
Specifies multiple ORDER BY conditions as an array.
```js
db.order_by(['name asc', 'last_name desc']);
// This would produce: … ORDER BY name asc, last_name desc …
```

# .group_by()

## .group_by(groupByCondition)
Specifies the GROUP BY condition as a full string.
```js
db.group_by('name asc');
// This would produce: … GROUP BY name asc …
```

You can call .group_by() multiple times within the scope of one query — all parameters will be used in the final query.

## .group_by([groupByCondition, groupByCondition, … ])
Specifies the GROUP BY condition as a full string.
```js
db.group_by(['name asc', 'last_name desc']);
// This would produce: … GROUP BY name asc, last_name desc …
```

# .join()

## .join(tableName, joinCondition, joinDirection)
Join additional tables to the query.
```js
db.join('pets', 'pets.owner_id = people.id', 'LEFT');
// This would produce: … LEFT JOIN pets ON pets.owner_id = people.id …

db.join('pets', 'pets.owner_id = people.id');
// This would produce: … JOIN pets ON pets.owner_id = people.id …
```

# .limit()

## .limit(limitNumber)
Adds a row limit to query results.
```js
db.limit(10);
// Limits query results to 10 rows.
```

## .limit(limitNumber, offsetNumber)
Adds a row limit with an offset pointer position to query results.
```js
db.limit(10, 30);
// Limits query results to 10 rows, starting from the 30th row in the full matching set.
```

# Query execution commands

After execution of a query, all query conditions are cleared. Results are passed down to responseCallback function. The parameters handed over to responseCallback match exactly what the underlying node-mysql module produces. See documentation from https://github.com/felixge/node-mysql

## .update(tableName, newData, responseCallback)
Produces and executes UPDATE query. 
```js
db.update('people', { first_name: 'John', last_name: 'Smith' }, function(err) { ... });
// This would produce: … UPDATE people SET first_name = 'John', last_name = 'Smith' …
```

## .delete(tableName, responseCallback)
Produces and executes DELETE query. Be sure to specify some WHERE clause components using .where() not to truncate an entire table. ✌
```js
db.delete('people', function(err) { ... });
```
	
## .insert(tableName, newData, responseCallback)
Produces and executes a single-row INSERT query. 
```js
db.insert('people', { first_name: 'John', last_name: 'Smith' }, function(err, info) { ... });
// This would produce: … INSERT INTO people SET first_name = 'John', last_name = 'Smith' …
```

## .insert(tableName, [newData, newData, newData, …], responseCallback)
Produces and executes a multi-row INSERT query. 
```js	
var person1 = { first_name: 'John', last_name: 'Smith' };
var person2 = { first_name: 'Jason', last_name: 'Binder' };
var person3 = { first_name: 'Herbert', last_name: 'von Kellogg' };
db.insert('people', [person1, person2, person3], function(err, info) { ... });
// This would produce: … INSERT INTO people (first_name, last_name) VALUES (('John','Smith'),('Jason','Binder'),('Herbert','von Kellogg')) …
```

## .insert_ignore(tableName, newData, responseCallback, onDuplicateKeyClause)
Produces and executes an INSERT IGNORE query. Note that the newData parameter can be either a string (produces single-row INSERT) or an array (produces multi-row INSERT). You can also specify an optional onDuplicateKeyClause, e.g.
```js	
db.insert_ignore('people', { first_name: 'John', last_name: 'Smith' }, function(err, info) { ... }, 'ON DUPLICATE KEY UPDATE duplicate_count = duplicate_count + 1');
// This would produce: … INSERT IGNORE INTO people SET first_name = 'John', last_name = 'Smith' … ON DUPLICATE KEY UPDATE duplicate_count = duplicate_count + 1
```

## .get(tableName, responseCallback)
Produces and executes a SELECT query.
```js
	db.get('people', function(err, rows, fields) { ... });
	// This would produce: SELECT … FROM people …
```
## .count(tableName, responseCallback)
Produces and executes a SELECT query with count.
```js
	db.get('people', function(err, rows, fields) { ... });
	// This would produce: SELECT count(*) FROM people …
```
## .query(sqlQueryString, responseCallback)
Produces and executes a raw query. Note that while no set query conditions will be used in this query, they will all be reset nevertheless with the execution.
```js
	db.query('SHOW TABLES FROM test_database', function(err, results) { ... });
```
## .ping()
Pings the connection. This is useful when extending idle timeouts.

## ._last_query()
Returns the last executed query as a string.

## .connection()
Returns the underlying database connection object, ultimately what https://github.com/felixge/node-mysql .createConnection() returns.

Pooling connections
===================

Single or multiple connections can be pooled with the Pool object.
```js
var Db = require('mysql-activerecord');

var pool = new Db.Pool({
	server: 'localhost',
	username: 'root',
	password: '12345',
	database: 'test'
});

pool.getNewAdapter(function(db) {
	db
		.where({ name: 'Martin' })
		.get('people', function(err, results, fields) {
			console.log(results);
			db.releaseConnection();
			// do not do anything with db that has been released.
		});
});
```

Some more usage examples
========================

Establishing a connection
-------------------------
```js
var Db = require('mysql-activerecord');
var db = new Db.Adapter({
	server: 'localhost',
	username: 'root',
	password: '12345',
	database: 'test'
});
```
	
Basic SELECT query
------------------
```js
db.get('people', function(err, results, fields) {
	console.log(results);
});
```
INSERT query
------------
```js	
var data = {
	name: 'Martin',
	email: 'martin@example.com'
};

db.insert('people', data, function(err, info) {
	console.log('New row ID is ' + info.insertId);
});
```
INSERT IGNORE query with ON DUPLICATE KEY clause
------------------------------------------------
```js
var data = {
	name: 'Martin',
	email: 'martin@example.com'
};

db.insert_ignore('people', data, function(err, info) {
	console.log('New row ID is ' + info.insertId);
}, 'ON DUPLICATE KEY SET counter = counter + 1');
	
SELECT query with WHERE clause
------------------------------
```js
db
	.where({ name: 'Martin' })
	.get('people', function(err, results, fields) {
		console.log(results);
	});
```
SELECT query with custom fields, WHERE, JOIN and LIMIT
------------------------------------------------------
```js
db
	.select(['people.id', 'people.name', 'people.email', 'songs.title'])
	.join('songs', 'people.favorite_song_id', 'left')
	.where({
		'people.name': 'Martin',
		'songs.title': 'Yesterday'
	})
	.limit(5, 10)
	.order_by('people.name asc')
	.get('people', function(err, results, fields) {
		console.log(results);
	});
```
Basic counting
------------------------------------------------------
```js
db
	.where({
		'people.name': 'Martin',
		'songs.title': 'Yesterday'
	})
	.count('people', function(err, results, fields) {
		console.log(results);
	});
```
SELECT query with custom fields and GROUP BY
--------------------------------------------
```js
db
	.select('name, COUNT(name) AS name_count')
	.group_by('name')
	.order_by('name_count DESC')
	.get('people', function(err, results, fields) {
		console.log(results);
	});
```
Basic UPDATE query
------------------
```js	
var newData = {
	name: 'John',
	email: 'john@doe.com'
};

db
	.where({ id: 1 })
	.update('people', newData, function(err) {
		if (!err) {
			console.log('Updated!');
		}
	});
```
Basic DELETE query
------------------
```js
db
	.where({ id: 1 })
	.delete('people', function(err) {
		if (!err) {
			console.log('Deleted!')
		}
	});

```
Advanced WHERE conditions
-------------------------
```js
db
	.where("title not like '%Jackson%'")
	.where("date_created > '2012-03-10'")
	.where({ owner_id: 32 })
	.delete('records', function(err) {
		if (!err) {
			console.log('Deleted!')
		}
	});

```
Contribute
==========

Got a missing feature you'd like to use? Found a bug? Go ahead and fork this repo, build the feature and issue a pull request.


Licence info
============

Licensed under the GPL license and MIT:

* http://www.opensource.org/licenses/GPL-license.php
* http://www.opensource.org/licenses/mit-license.php

