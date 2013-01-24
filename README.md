MySQL ActiveRecord Adapter for Node.js
======================================

Active Record Database Pattern implementation for use with node-mysql (https://github.com/felixge/node-mysql) as MySQL connection driver.

It enables similar database operations as in CodeIgniter (a PHP web applications framework). The main benefit and the reason I worked on this was the ability to direct JavaScript objects straight to MySQL queries without having to worry about constructing the query itself. Although Active Record is maybe a tiny step closer to ORM, I see a lot of value in the Active Record as it allows more control over database queries than traditional ORM.

 * Light-weight
 * Supports all basic MySQL commands
 * Supports method chaining
 * Automatically escapes field values

How to install
==============

	npm install mysql-activerecord

Licence info
============

Copyright (c) 2011 Martin Tajur (martin@tajur.ee)
Licensed under the GPL license and MIT:

* http://www.opensource.org/licenses/GPL-license.php
* http://www.opensource.org/licenses/mit-license.php

Basic support of MySQL commands
===============================

 * SELECT
 * UPDATE
 * INSERT (both single and multirow)
 * INSERT IGNORE
 * DELETE
 * JOIN
 * LIMIT and OFFSET
 * ORDER BY
 
Usage examples
==============

Establishing a connection
-------------------------

    var db = new require('mysql-activerecord').Adapter({
    	server: 'localhost',
    	username: 'root',
    	password: '12345',
    	database: 'test'
    });
    
Basic SELECT query
------------------

	db.get('people', function(err, results, fields) {
		console.log(results);
	});

INSERT query
------------
	
	var data = {
		name: 'Martin',
		email: 'martin@example.com'
	};
	
	db.insert('people', data, function(err, info) {
		console.log('New row ID is ' + info.insertId);
	});

INSERT IGNORE query with ON DUPLICATE KEY clause
------------------------------------------------
	
	var data = {
		name: 'Martin',
		email: 'martin@example.com'
	};
	
	db.insert_ignore('people', data, function(err, info) {
		console.log('New row ID is ' + info.insertId);
	}, 'ON DUPLICATE KEY SET counter = counter + 1');
	
SELECT query with WHERE clause
------------------------------

	db
		.where({ name: 'Martin' })
		.get('people', function(err, results, fields) {
			console.log(results);
		});

SELECT query with custom fields, WHERE, JOIN and LIMIT
---------------------------------------------------

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

Basic UPDATE query
------------------
	
	var newData = {
		name: 'John',
		email: 'john@doe.com'
	};
	
	db
		.where({ id: 1 });
		.update('people', newData, function(err) {
			if (!err) {
				console.log('Updated!');
			}
		});

Basic DELETE query
------------------

	db
		.where({ id: 1 })
		.delete('people', function(err) {
			if (!err) {
				console.log('Deleted!')
			}
		});


Advanced WHERE conditions
-------------------------

	db
		.where("title not like '%Jackson%'")
		.where("date_created > '2012-03-10'")
		.where({ owner_id: 32 })
		.delete('records', function(err) {
			if (err) {
				console.log('Deleted!')
			}
		});


Methods
=======

 * .select(selectFieldName)
 * .select([selectFieldName, selectFieldName, ... ])
 * .where(rawClause)
 * .where(fieldName, [possibleWhereInValue, possibleWhereInValue])
 * .where(fieldName, fieldValue)
 * .where({ fieldName: fieldValue, fieldName: fieldValue, ... })
 * .order_by(orderByCondition)
 * .order_by([orderByCondition, orderByCondition, ... ])
 * .join(tableName, joinCondition, joinDirection)
 * .update(tableName, newData, responseCallback)
 * .delete(tableName, responseCallback)
 * .insert(tableName, newData, responseCallback)
 * .insert_ignore(tableName, newData, responseCallback, onDuplicateKeyClause)
 * .get(tableName, responseCallback)
 * .limit(limitNumber)
 * .limit(limitNumber, offsetNumber)
 * .query(sqlQueryString, responseCallback)
 * .ping()
 * ._last_query()
 * .connection()
