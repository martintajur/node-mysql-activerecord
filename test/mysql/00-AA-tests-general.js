const should = require('chai').should();

describe('MySQL: QueryBuilder', () => {
    it('actually exists and can be initialized', () => {
        const QueryBuilder = require('../../drivers/mysql/query_builder.js');
        const qb = new QueryBuilder();
        qb.should.be.instanceOf(QueryBuilder);
    });
});
