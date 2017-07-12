mocha --timeout 5000 --reporter markdown test/*.js
# TOC
   - [from()](#from)
   - [QueryBuilder](#querybuilder)
   - [join()](#join)
   - [select()](#select)
   - [where()](#where)
<a name=""></a>

<a name="from"></a>
# from()
should exist.

```js
should.exist(qb.from);
```

should be a function.

```js
qb.from.should.be.a('function');
```

should have an array to put fields into.

```js
qb.should.have.property('fromArray');
```

should have an empty array to put fields into at the beginning.

```js
qb.fromArray.should.be.empty;
```

should add an item to an array and escape it properly.

```js
qb.from('universe');
qb.fromArray.should.eql(['`universe`']);
```

should accept a comma-delimited string of items and trim and escape each properly.

```js
qb.resetQuery();
qb.from('universe,galaxy  ,  star_system, planet');
qb.fromArray.should.eql(['`universe`','`galaxy`','`star_system`','`planet`']);
```

should have an empty array after resetting.

```js
qb.resetQuery();
qb.fromArray.should.be.empty;
```

should be allowed to be called multiple times to add multiple items to the from array.

```js
qb.resetQuery();
qb.from('universe').from('galaxy').from('star_system').from('planet');
qb.fromArray.should.eql(['`universe`','`galaxy`','`star_system`','`planet`']);
```

should accept an array of items and add them individually to the from array.

```js
qb.resetQuery();
qb.from(['universe','galaxy','star_system','planet']);
qb.fromArray.should.eql(['`universe`','`galaxy`','`star_system`','`planet`']);
```

should not double-escape an item.

```js
qb.resetQuery();
		qb.from('`do`');
		qb.fromArray.should.eql(['`do`']);
```

should not double-escape items when provided with an array of pre-escaped items.

```js
qb.resetQuery();
		qb.from(['`universe`','`galaxy`','`star_system`']);
		qb.fromArray.should.eql(['`universe`','`galaxy`','`star_system`']);
```

should not double-escape items when provided with an array of pre-escaped items but should escpae non-pre-escaped items.

```js
qb.resetQuery();
		qb.from(['`universe`','galaxy','`star_system`']);
		qb.fromArray.should.eql(['`universe`','`galaxy`','`star_system`']);
```

should allow for aliases and it should escape them properly.

```js
qb.resetQuery();
qb.from('universe u');
qb.fromArray.should.eql(['`universe` `u`']);
```

should allow for the word AS to be used to alias an item.

```js
qb.resetQuery();
qb.from('universe as u');
qb.fromArray.should.eql(['`universe` as `u`']);
```

should allow for an array of item + aliases and it should escape them all properly.

```js
qb.resetQuery();
qb.from(['universe u', 'galaxy g']);
qb.fromArray.should.eql(['`universe` `u`','`galaxy` `g`']);
```

should allow for an array of item + aliases that are pre-escaped and it should not double-escape them.

```js
qb.resetQuery();
qb.from(['`universe` `u`', '`galaxy` `g`']);
qb.fromArray.should.eql(['`universe` `u`','`galaxy` `g`']);
```

should allow for an array of item + aliases where some are pre-escaped and it should not double-escape pre-escaped items.

```js
qb.resetQuery();
qb.from(['`universe` u', 'galaxy `g`']);
qb.fromArray.should.eql(['`universe` `u`','`galaxy` `g`']);
```

should add aliases to alias-tracking array.

```js
qb.resetQuery();
qb.from(['`universe` `u`', '`galaxy` `g`']);
qb.aliasedTables.should.eql(['u','g']);
```

should allow for an comma-delimited list of item + aliases and it should escape them all properly.

```js
qb.resetQuery();
qb.from(['universe u, galaxy g']);
qb.fromArray.should.eql(['`universe` `u`','`galaxy` `g`']);
```

should allow for namespacing in field name (host.db.table).

```js
qb.resetQuery();
qb.from('star_system.planet');
qb.fromArray.should.eql(['`star_system`.`planet`']);

qb.resetQuery();
qb.from('galaxy.star_system.planet');
qb.fromArray.should.eql(['`galaxy`.`star_system`.`planet`']);
```

should allow for namespacing in field name (host.db.table.column) + alias.

```js
qb.resetQuery();
qb.from('universe.galaxy.star_system planet');
qb.fromArray.should.eql(['`universe`.`galaxy`.`star_system` `planet`']);
```

should allow for namespacing in field name (host.db.table.column) + alias (declare with AS).

```js
qb.resetQuery();
qb.from('universe.galaxy.star_system as planet');
qb.fromArray.should.eql(['`universe`.`galaxy`.`star_system` as `planet`']);
```

<a name="querybuilder"></a>
# QueryBuilder
actually exists and can be initialized.

```js
const qb = new QueryBuilder();
qb.should.be.instanceOf(Object);
```

<a name="join"></a>
# join()
should exist.

```js
should.exist(qb.join);
```

should be a function.

```js
qb.join.should.be.a('function');
```

should have an array to put fields into.

```js
qb.should.have.property('joinArray');
```

should have an empty array to put fields into at the beginning.

```js
qb.joinArray.should.be.empty;
```

should require a string to be passed as first parameter.

```js
const invalid_match = /must provide a table/;
expect(() => qb.join(), 'nothing provided').to.throw(Error, invalid_match);
expect(() => qb.join(true), 'true provided').to.throw(Error, invalid_match);
expect(() => qb.join(null), 'null provided').to.throw(Error, invalid_match);
expect(() => qb.join(false), 'false provided').to.throw(Error, invalid_match);
expect(() => qb.join({}), 'object provided').to.throw(Error, invalid_match);
expect(() => qb.join([]), 'empty array provided').to.throw(Error, invalid_match);
expect(() => qb.join(''), 'empty string provided').to.throw(Error, invalid_match);
expect(() => qb.join('  '), 'string of spaces provided').to.throw(Error, invalid_match);
expect(() => qb.join('foo'), 'valid string provided').to.not.throw(Error);
expect(() => qb.join('foo'), 'valid string provided').to.not.throw(Error);
```

should except single item and add it to join array as basic join and escape item.

```js
qb.resetQuery();
qb.join('universe');
qb.joinArray.should.eql(['JOIN `universe` ']);
```

should except single item with alias and add it to join array as basic join and escape each part.

```js
qb.resetQuery();
qb.join('universe u');
qb.joinArray.should.eql(['JOIN `universe` `u` ']);
```

should allow a string (and only a string) to be passed as second parameter but only if a valid (or no) third parameter is provided.

```js
const invalid_2nd_param = /You must provide a valid condition to join on when providing a join direction/;
const invalid_direction = /Invalid join direction provided as third parameter/;

expect(() => qb.join('universe',null,'left'), 'null 2nd param').to.throw(Error,invalid_2nd_param);
expect(() => qb.join('universe',false,'left'), 'false 2nd param').to.throw(Error,invalid_2nd_param);
expect(() => qb.join('universe','','left'), 'empty string 2nd param').to.throw(Error,invalid_2nd_param);
expect(() => qb.join('universe','   ','left'), 'just spaces 2nd param').to.throw(Error,invalid_2nd_param);
expect(() => qb.join('universe',5,'left'), 'integer 2nd param').to.throw(Error,invalid_2nd_param);
expect(() => qb.join('universe',5.6,'left'), 'float 2nd param').to.throw(Error,invalid_2nd_param);
expect(() => qb.join('universe',[],'left'), 'array 2nd param').to.throw(Error,invalid_2nd_param);
expect(() => qb.join('universe',{},'left'), 'object 2nd param').to.throw(Error,invalid_2nd_param);
expect(() => qb.join('universe','foo = bar','fake'), 'invalid 3rd param').to.throw(Error,invalid_direction);
expect(() => qb.join('universe','foo = bar'), 'no 3rd param').to.not.throw(Error);
expect(() => qb.join('universe','foo = bar','left'), '3 valid params').to.not.throw(Error);
```

should allow valid join direction to be passed in third parameter.

```js
// NOTE: A lot of this functionality was already tested when testing second param
const invalid_direction = /Invalid join direction provided as third parameter/;

expect(() => qb.join('universe','foo = bar','fake'), 'invalid 3rd param').to.throw(Error,invalid_direction);
expect(() => qb.join('universe',null,null), 'invalid 2nd and 3rd params').to.not.throw(Error);
expect(() => qb.join('universe','foo = bar',''), 'empty third param').to.not.throw(Error);
expect(() => qb.join('universe','foo = bar','   '), 'just spaces').to.not.throw(Error);
expect(() => qb.join('universe','foo = bar',null), 'null third param').to.not.throw(Error);
expect(() => qb.join('universe','foo = bar',false), 'false third param').to.not.throw(Error);
expect(() => qb.join('universe','foo = bar',5), 'integer third param').to.not.throw(Error);
expect(() => qb.join('universe','foo = bar',5.5), 'float third param').to.not.throw(Error);
expect(() => qb.join('universe','foo = bar',{}), 'object third param').to.not.throw(Error);
expect(() => qb.join('universe','foo = bar',[]), 'array third param').to.not.throw(Error);
expect(() => qb.join('universe','foo = bar','left  '), 'trailing space').to.not.throw(Error);
expect(() => qb.join('universe','foo = bar',' left '), 'leading and trailing space').to.not.throw(Error);
expect(() => qb.join('universe','foo = bar','  left'), 'leading space').to.not.throw(Error);
expect(() => qb.join('universe','foo = bar','left'), 'lowercase direction').to.not.throw(Error);
expect(() => qb.join('universe','foo = bar','LEFT'), 'uppercase direction').to.not.throw(Error);
expect(() => qb.join('universe','foo = bar','LEFT OUTER'), 'two word direction').to.not.throw(Error);
```

should except a valid second parameter as a join condition and escape it properly.

```js
qb.resetQuery();
qb.join('universe u','u.type_id = ut.id');
qb.joinArray.should.eql(['JOIN `universe` `u` ON `u`.`type_id` = `ut`.`id`']);
```

should escape compound objects properly.

```js
qb.resetQuery();
qb.join('universe.galaxy.star_system s','s.type_id = st.id');
qb.joinArray.should.eql(['JOIN `universe`.`galaxy`.`star_system` `s` ON `s`.`type_id` = `st`.`id`']);
```

should add aliases to alias-tracking array.

```js
qb.resetQuery();
qb.join('universe.galaxy.star_system s');
qb.aliasedTables.should.eql(['s']);
```

should properly place join direction into join clause.

```js
qb.resetQuery();
qb.join('universe.galaxy.star_system s', 's.type_id = st.id', 'left outer');
qb.joinArray.should.eql(['LEFT OUTER JOIN `universe`.`galaxy`.`star_system` `s` ON `s`.`type_id` = `st`.`id`']);
```

should be chainable to allow for multiple join clauses.

```js
qb.resetQuery();
qb.join('star_system s', 's.type_id = st.id', 'left outer').join('planets p','p.star_system_id = s.id','left');
qb.joinArray.should.eql(['LEFT OUTER JOIN `star_system` `s` ON `s`.`type_id` = `st`.`id`', 'LEFT JOIN `planets` `p` ON `p`.`star_system_id` = `s`.`id`']);
```

should escape complex join conditions.

```js
qb.resetQuery();
qb.join('star_system s', "s.type_id = st.id AND st.active = 1 AND st.created_on > '2014-01-01'", 'left');
qb.joinArray.should.eql(["LEFT JOIN `star_system` `s` ON `s`.`type_id` = `st`.`id` AND `st`.`active` = 1 AND `st`.`created_on` > '2014-01-01'"]);
```

<a name="select"></a>
# select()
should exist.

```js
should.exist(qb.select);
```

should be a function.

```js
qb.select.should.be.a('function');
```

should have an array to put fields into.

```js
qb.should.have.property('selectArray');
```

should have an empty array to put fields into at the beginning.

```js
qb.selectArray.should.be.empty;
```

should require an array or string to be passed as first parameter.

```js
const invalid_match = /requires a string or array/;
const empty_str_match = /string is empty/;
const empty_arr_match = /array is empty/;
expect(() => qb.select(), 'nothing provided').to.throw(Error, invalid_match);
expect(() => qb.select(true), 'true provided').to.throw(Error, invalid_match);
expect(() => qb.select(null), 'null provided').to.throw(Error, invalid_match);
expect(() => qb.select(false), 'false provided').to.throw(Error, invalid_match);
expect(() => qb.select({}), 'object provided').to.throw(Error, invalid_match);
expect(() => qb.select([]), 'empty array provided').to.throw(Error, empty_arr_match);
expect(() => qb.select(''), 'empty string provided').to.throw(Error, empty_str_match);
expect(() => qb.select('  '), 'string of spaces provided').to.throw(Error, empty_str_match);
expect(() => qb.select('blah'), 'valid string provided').to.not.throw(Error);
```

should add field to array and escape it properly.

```js
qb.resetQuery();
qb.select('notes');
qb.selectArray.should.eql(['`notes`']);
```

should trim fields properly before placing them into the select array.

```js
qb.resetQuery();
qb.select('   notes         ');
qb.selectArray.should.eql(['`notes`']);
```

should have an empty array after resetting.

```js
qb.resetQuery();
qb.selectArray.should.be.empty;
```

should not escape fields if asked not to.

```js
qb.resetQuery();
qb.select('foo',false);
qb.selectArray.should.eql(['foo']);
```

should accept a comma-delimited string of field names and trim and escape each properly.

```js
qb.resetQuery();
qb.select('do,re  ,  mi, fa');
qb.selectArray.should.eql(['`do`','`re`','`mi`','`fa`']);
```

should be allowed to be called multiple times to add multiple fields to the select array.

```js
qb.resetQuery();
qb.select('do').select('re').select('mi').select('fa');
qb.selectArray.should.eql(['`do`','`re`','`mi`','`fa`']);
```

should be allowed to be called multiple times to add multiple escaped and/or non-escaped fields to the select array.

```js
qb.resetQuery();
qb.select('do').select('re',false).select('mi',false).select('fa');
qb.selectArray.should.eql(['`do`','re','mi','`fa`']);
```

should accept an array of fields and add them individually to the select array.

```js
qb.resetQuery();
qb.select(['sol','la','ti','do']);
qb.selectArray.should.eql(['`sol`','`la`','`ti`','`do`']);
```

should accept an array of fields and add them individually to the select array without escaping, if asked not to.

```js
qb.resetQuery();
qb.select(['sol','la','ti','do'],false);
qb.selectArray.should.eql(['sol','la','ti','do']);
```

should accept an array of fields (some manually escaped) and add them individually to the select array without auto-escaping, if asked not to.

```js
qb.resetQuery();
qb.select(['`sol`','la','ti','`do`'],false);
qb.selectArray.should.eql(['`sol`','la','ti','`do`']);
```

should not double-escape a field.

```js
qb.resetQuery();
		qb.select('`do`');
		qb.selectArray.should.eql(['`do`']);
```

should not double-escape fields when provided with an array of pre-escaped fields.

```js
qb.resetQuery();
		qb.select(['`do`','`re`','`mi`']);
		qb.selectArray.should.eql(['`do`','`re`','`mi`']);
```

should not double-escape fields when provided with an array of pre-escaped fields but should escpae non-pre-escaped fields.

```js
qb.resetQuery();
		qb.select(['`do`','re','`mi`']);
		qb.selectArray.should.eql(['`do`','`re`','`mi`']);
```

should allow for field aliases to be provided and those fields and aliases should be properly escaped.

```js
qb.resetQuery();
qb.select('foo as bar');
qb.selectArray.should.eql(['`foo` as `bar`']);
```

should not double-escape aliases.

```js
qb.resetQuery();
qb.select(['foo as `bar`']);
qb.selectArray.should.eql(['`foo` as `bar`']);
```

should allow for multiple fields with aliases to be provided and those fields and aliases should be properly escaped.

```js
qb.resetQuery();
qb.select(['foo as bar','bar as foo']);
qb.selectArray.should.eql(['`foo` as `bar`','`bar` as `foo`']);
```

should allow for field aliases with spaces in them.

```js
qb.resetQuery();
qb.select('notes as The Notes');
qb.selectArray.should.eql(['`notes` as `The Notes`']);
```

should allow for a comma-delimited list of fields with aliases to be provided and those fields and aliases should be properly escaped.

```js
qb.resetQuery();
qb.select('foo as bar, bar as foo, foobar as `Foo Bar`');
qb.selectArray.should.eql(['`foo` as `bar`','`bar` as `foo`','`foobar` as `Foo Bar`']);
```

should allow for namespacing in field name (host.db.table.field).

```js
qb.resetQuery();
qb.select('star_system.planet');
qb.selectArray.should.eql(['`star_system`.`planet`']);

qb.resetQuery();
qb.select('galaxy.star_system.planet');
qb.selectArray.should.eql(['`galaxy`.`star_system`.`planet`']);

qb.resetQuery();
qb.select('universe.galaxy.star_system.planet');
qb.selectArray.should.eql(['`universe`.`galaxy`.`star_system`.`planet`']);
```

should allow for namespacing in field name (host.db.table.column) + alias.

```js
qb.resetQuery();
qb.select('universe.galaxy.star_system.planet as planet');
qb.selectArray.should.eql(['`universe`.`galaxy`.`star_system`.`planet` as `planet`']);
```

should not allow subqueries or functions with commas in them without the second parameter being false.

```js
qb.resetQuery();
expect(
	() => qb.select('s.star_systems, (select count(p.*) as count from planets p where p.star_system_id IN(2,3,5)) as num_planets')
).to.throw(Error);

expect(
	() => qb.select('s.star_systems, (select count(p.*) as count from planets p where p.star_system_id IN(2,3,5)) as num_planets',false)
).to.not.throw(Error);
```

should allow for functions and subqueries in statement without escaping them (aliases at the end will still be escaped).

```js
qb.resetQuery();
qb.select('count(*) as count', false);
qb.selectArray.should.eql(['count(*) AS `count`']);

qb.resetQuery();
qb.select('count(*) as count, m.*, MIN(id) as min', false);
qb.selectArray.should.eql(['count(*) as count, m.*, MIN(id) AS `min`']);

qb.resetQuery();
qb.select('(select count(p.*) as count from planets p) as num_planets', false);
qb.selectArray.should.eql(['(select count(p.*) as count from planets p) AS `num_planets`']);

qb.resetQuery();
qb.select('s.star_systems, (select count(p.*) as count from planets p where p.star_system_id = s.id) as num_planets', false);
qb.selectArray.should.eql(['s.star_systems, (select count(p.*) as count from planets p where p.star_system_id = s.id) AS `num_planets`']);
```

<a name="where"></a>
# where()
should exist.

```js
should.exist(qb.where);
```

should be a function.

```js
qb.where.should.be.a('function');
```

should accept a field name in the form of a string as the first parameter.

```js
qb.where('planet');
qb.whereArray.should.eql(['`planet` IS NULL']);
```

should assume second param is NULL if not provided.

```js
qb.resetQuery();
qb.where('planet');
qb.whereArray.should.eql(['`planet` IS NULL']);
```

should accept NULL as second parameter and assume IS NULL.

```js
qb.resetQuery();
qb.where('planet',null);
qb.whereArray.should.eql(['`planet` IS NULL']);
```

should accept boolean values and will transform them properly.

```js
qb.resetQuery();
qb.where('planet',true);
qb.whereArray.should.eql(['`planet` = 1']);

qb.resetQuery();
qb.where('planet',false);
qb.whereArray.should.eql(['`planet` = 0']);
```

should accept integer and float values.

```js
qb.resetQuery();
qb.where('planet',5);
qb.whereArray.should.eql(['`planet` = 5']);

qb.resetQuery();
qb.where('planet',123.456);
qb.whereArray.should.eql(['`planet` = 123.456']);
```

should accept string values.

```js
qb.resetQuery();
qb.where('planet','Earth');
qb.whereArray.should.eql(["`planet` = 'Earth'"]);

qb.resetQuery();
qb.where('galaxy','Milky Way');
qb.whereArray.should.eql(["`galaxy` = 'Milky Way'"]);
```

should accept arrays of values and assume a WHERE IN clause.

```js
qb.resetQuery();
qb.where('planet',['Mercury','Venus','Earth','Mars']);
qb.whereArray.should.eql(["`planet` IN ('Mercury', 'Venus', 'Earth', 'Mars')"]);
```

should concatenate multiple where clauses with AND by default.

```js
qb.resetQuery();
qb.where('planet',['Mercury','Venus','Earth','Mars']);
qb.where('galaxy','Milky Way');
qb.whereArray.should.eql(["`planet` IN ('Mercury', 'Venus', 'Earth', 'Mars')","AND `galaxy` = 'Milky Way'"]);
```

should be chainable.

```js
qb.resetQuery();
qb.where('planet',['Mercury','Venus','Earth','Mars']).where('galaxy','Milky Way');
qb.whereArray.should.eql(["`planet` IN ('Mercury', 'Venus', 'Earth', 'Mars')","AND `galaxy` = 'Milky Way'"]);
```

should accept an object of key/value pairs (field: value).

```js
qb.resetQuery();
qb.where({planet:'Earth',star_system:'Solar'});
qb.whereArray.should.eql(["`planet` = 'Earth'", "AND `star_system` = 'Solar'"]);
```

should accept an object of key/value pairs (field: value) where values can be arrays.

```js
qb.resetQuery();
qb.where({star_system:'Solar',planet:['Earth','Mars']});
qb.whereArray.should.eql(["`star_system` = 'Solar'", "AND `planet` IN ('Earth', 'Mars')"]);
```

should accept an operators in the first parameter.

```js
qb.resetQuery();
qb.where('position >',3);
qb.whereArray.should.eql(["`position` > 3"]);

qb.resetQuery();
qb.where('position <',3);
qb.whereArray.should.eql(["`position` < 3"]);

qb.resetQuery();
qb.where('position >=',3);
qb.whereArray.should.eql(["`position` >= 3"]);

qb.resetQuery();
qb.where('position <=',3);
qb.whereArray.should.eql(["`position` <= 3"]);

qb.resetQuery();
qb.where('position <>',3);
qb.whereArray.should.eql(["`position` <> 3"]);

qb.resetQuery();
qb.where('position !=',3);
qb.whereArray.should.eql(["`position` != 3"]);
```

should not escape fields if asked not to.

```js
qb.resetQuery();
qb.where({star_system:'Solar',planet:['Earth','Mars']},false);
qb.whereArray.should.eql(["star_system = 'Solar'", "AND planet IN ('Earth', 'Mars')"]);
```

