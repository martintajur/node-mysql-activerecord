var should = require('chai').should();
var expect = require('chai').expect;
var qb = require('../../drivers/mysql/query_builder.js').QueryBuilder();

var test_where = {id:3};
var test_data = [{id:3, name:'Milky Way', type: 'spiral'}, {id:4, name: 'Andromeda', type: 'spiral'}];

describe('update_batch()', function() {
	it('should exist', function() {
		should.exist(qb.update_batch);
	});
	it('should be a function', function() {
		qb.update_batch.should.be.a('function');
	});
	it('should build a proper batch UPDATE string', function() {
		qb.reset_query();
		var sql = qb.update_batch('galaxies', test_data, 'id');
		sql.should.eql(["UPDATE (`galaxies`) SET `name` = CASE WHEN `id` = 3 THEN 'Milky Way' WHEN `id` = 4 THEN 'Andromeda' ELSE `name` END, `type` = CASE WHEN `id` = 3 THEN 'spiral' WHEN `id` = 4 THEN 'spiral' ELSE `type` END WHERE `id` IN (3,4)"]);
	});
});