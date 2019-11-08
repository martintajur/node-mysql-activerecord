# Changes

This file is a manually maintained list of changes for each release. Feel free
to add your changes here when sending pull requests. Also send corrections if
you spot any mistakes.

## v2.1.1 (2019-11-08)

* Updated documentation to reflect new Promise API support.

## v2.1.0 (2019-11-08)

* Added Promise support. Closes [#18](https://github.com/kylefarris/node-querybuilder/pull/52). Thanks for the contribution @AbhijetPokhrel!
* Added new tests to verify that Promise support is working.

## v2.0.2 (2019-10-28)

* Finally got testing working on Travis CI for MySQL and MSSQL.

## v2.0.0 (2018-06-15)

### Breaking Changes
* Changed the Query Builder instantiation syntax
* Passing an empty array to `where_in` and `where_not_in` no longer throws an error ([#34](https://github.com/kylefarris/node-querybuilder/issues/34))

# General Enhancements/Changes/Features
* Added mssql (t-sql) support using `tedious` as the underlying driver
* Updated class files to use new ES6 class syntax for easier-maintainability
* Added new options:
** `pool_min` (minimum number of pooled connections (`mssql` driver only))
** `acquireTimeout` (milliseconds before a timeout occurs during the connection acquisition)
* Added new query building method: `returning()` to allow for insert IDs to be returned. See docs for more info.
* Added new tests

### Bug Fixes
* Fixed [#18](https://github.com/kylefarris/node-querybuilder/issues/18)
* Fixed [#23](https://github.com/kylefarris/node-querybuilder/issues/23)
* Fixed [#26](https://github.com/kylefarris/node-querybuilder/issues/26)
* Fixed [#28](https://github.com/kylefarris/node-querybuilder/issues/28)
* Fixed [#30](https://github.com/kylefarris/node-querybuilder/issues/30)
* Fixed [#33](https://github.com/kylefarris/node-querybuilder/issues/33)


## v1.2.0 (2018-05-18)

* retroactive fix of this change log
* updated the mysql escape string to use the proper mysql method.

## v1.1.1 (2018-05-17)

* Updated package.json to always use the latest version of mysql 2.x

## v1.1.0 (2018-02-20)

* Fixed a bug where you could not insert with leading zeros. #20

## v1.0.3 (2017-08-22)

* Fixed a bug in how it's checking for valid connection types. Also updated tests to allow for an empty driver string in QueryBuilder constructor (defaults to 'mysql').

## v1.0.2 (2017-08-22)

* Fixed a bug dealing with the default 'driver' param value in the QueryBuilder contructor

## v1.0.1 (2017-08-10)

* Fixed a bug where non-strings or non-array-of-strings could be passed to the method and cause issues

## v1.0.0 (2017-07-26)

* Updated codebase to ES6

## v0.15.0 (2017-04-27)

* Fixed and documented the escape property of the `join` method.

## v0.9.0 (2015-02-05)

* Added this history file
* Added the ability to do `SELECT DISTINCT` queries
* We're doing better escaping of identifiers now
* Added the ability to use table/view prefixes directly (ex. `select * from users u`)
* Added the ability to do `OR WHERE` statements with `or_where()` method.
* Added the ability to do `LIKE` statements directly (new methods: `like()`, `not_like()`, `or_like()`, `or_not_like()`)
* Restored ability to do `WHERE IN(...)` statements by passing an array as the second param to `where()`
* Added the ability to do `[OR] WHERE [NOT] IN(...)` statements directly (new methods: `where_in()`, `or_where_in()`, `where_not_in()`, `or_where_not_in()`)
* Added the ability to do `FROM` statements directly for `SELECT` and `DELETE` queries (new method: `from()`) (ex. db.from('foo').get(() => ...))
* Identifiers will now be properly escaped in `JOIN` statements.
* Added the ability to call `get_where()` as a shorthand to `get()` and `where()` (ex. `db.get_where('table',{foo: 'bar'},() => ...);`)
* Added the ability to call `select_min()`, `select_max()`, `select_avg()`, and `select_sum()`.
* Significanly improved security, helping to prevent SQL injection attacks.
* Added ability to do `OR HAVING` statements with `or_having()` method
* Added ability to add an offset directly without using the `limit()` method by using the `offset()` method.
* Added ability to set `SET` values for updates and inserts using the `set()` method.
* `UPDATE` statements now support `ORDER BY` clauses which can be added to the query using the `order_by()` method.
* The `update()` method's 3rd parameter can now either be the callback (as always) or a `WHERE` clause (ex. 'foo = "bar"' or {foo:'bar', id: 3}). If a where clause is provided, the callback is now the 4th parameter. This change is fully backwards-compatible with the previous version of this module.
* New package dependencies (for testing): chai and mocha.
* Tests have been written for better-ensuring future enhancements and fixes to not break functionality
* Library has been broken into 3 objects to allow for prpoer testing. This won't affect the API and is fully-backwards compatible with the previous version.
* Officially announcing that how third parameter of the `where()` method works is deprecated... starting with v1.0.0, third param will be `(bool) escape` and not `(bool) isRaw`. So, all calls to this method using the 3rd parameter will, in future, have to be changed by converting `true` to `false` and vice versa. This is so that we have a consistent API throughout the library.
* Name officially changed to node-mysql-querybuilder.
* Author officially changed to Kyle Farris due to the substantial changes to this fork and Martin Tajur demoted to primary contributor (thanks for the great starting place Martin!!)
* Name of internal methods and properties have been normalized to use the "lower_case" syntax.
* Dependency for node-mysql upgraded to 2.5.
* travis-ci functionality added to repository
* Added public `escape()` method
* Added funtional `update_batch()` method.
* Added `truncate()` and `empty_table()` methods.
