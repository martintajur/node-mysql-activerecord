var should = require('chai').should();

describe('QueryBuilder', function() {
	var QueryBuilder = require('../../drivers/mysql/query_builder.js');
	
	it('actually exists and can be initialized', function() {
		var qb = new QueryBuilder();
		qb.should.be.instanceOf(Object);
	});
});