# Changes

This file is a manually maintained list of changes for each release. Feel free
to add your changes here when sending pull requests. Also send corrections if
you spot any mistakes.

## v0.9.0 (2014-07-15)

* Added this history file
* Added the ability to do `SELECT DISTINCT` queries
* We're doing better escaping of identifiers now
* Added the ability to use table/view prefixes directly (ex. `select * from users u`)
* Added the ability to do `OR WHERE` statements with `or_where()` method.
* Added the ability to do `LIKE` statements directly (new methods: `like()`, `not_like()`, `or_like()`, `or_not_like()`)
* Restored ability to do `WHERE IN(...)` statements by passing an array as the second param to `where()`
* Added the ability to do `[OR] WHERE [NOT] IN(...)` statements directly (new methods: `where_in()`, `or_where_in()`, `where_not_in()`, `or_where_not_in()`)