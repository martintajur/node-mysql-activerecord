const should = require('chai').should();

describe('QueryBuilder', () => {
	it('actually exists and can be initialized', () => {
		const qb = require('../../drivers/mysql/query_builder.js').QueryBuilder();
		qb.should.be.instanceOf(Object);
	});
});