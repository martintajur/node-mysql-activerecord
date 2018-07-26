const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mysql/query_builder.js');
const qb = new QueryBuilder();

const test_where = {quadrant: 'Alpha'};
const test_data = [{id:3, name:'Milky Way', type: 'spiral'}, {id:4, name: 'Andromeda', type: 'spiral'}];

describe('MySQL: update_batch()', () => {
    it('should exist', () => {
        should.exist(qb.update_batch);
    });
    it('should be a function', () => {
        qb.update_batch.should.be.a('function');
    });
    it('should build a proper batch UPDATE string', () => {
        qb.reset_query();
        const sql = qb.update_batch('galaxies', test_data, 'id');
        sql.should.eql(["UPDATE (`galaxies`) SET `name` = CASE WHEN `id` = 3 THEN 'Milky Way' WHEN `id` = 4 THEN 'Andromeda' ELSE `name` END, `type` = CASE WHEN `id` = 3 THEN 'spiral' WHEN `id` = 4 THEN 'spiral' ELSE `type` END WHERE `id` IN (3,4)"]);
    });
    it('should build a proper batch UPDATE string when where clause is provided', () => {
        qb.reset_query();
        const sql = qb.update_batch('galaxies', test_data, 'id', test_where);
        sql.should.eql(["UPDATE (`galaxies`) SET `name` = CASE WHEN `id` = 3 THEN 'Milky Way' WHEN `id` = 4 THEN 'Andromeda' ELSE `name` END, `type` = CASE WHEN `id` = 3 THEN 'spiral' WHEN `id` = 4 THEN 'spiral' ELSE `type` END WHERE `quadrant` = 'Alpha' AND `id` IN (3,4)"]);
    });
});
