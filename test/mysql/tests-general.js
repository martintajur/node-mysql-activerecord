const should = require('chai').should();

describe('QueryBuilder', function() {
	it('actually exists and can be initialized', function() {
		const qb = require('../../drivers/mysql/query_builder.js').QueryBuilder();
		qb.should.be.instanceOf(Object);
	});
});