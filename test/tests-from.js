var should = require('chai').should();
var QueryBuilder = require('../lib/query_builder.js');
var qb = new QueryBuilder();

describe('from()', function() {
	it('should exist', function() {
		should.exist(qb.from);
	});
	it('should be a function', function() {
		qb.from.should.be.a('function');
	});
	it('should have an array to put fields into', function() {
		qb.should.have.property('fromArray');
	});
	it('should have an empty array to put fields into at the beginning', function() {
		qb.fromArray.should.be.empty;
	});
	it('should add an item to an array and escape it properly', function() {
		qb.from('universe');
		qb.fromArray.should.eql(['`universe`']);
	});
	it('should accept a comma-delimited string of items and trim and escape each properly', function() {
		qb.resetQuery();
		qb.from('universe,galaxy  ,  star_system, planet');
		qb.fromArray.should.eql(['`universe`','`galaxy`','`star_system`','`planet`']);
	});
	it('should have an empty array after resetting', function() {
		qb.resetQuery();
		qb.fromArray.should.be.empty;
	});
	it('should be allowed to be called multiple times to add multiple items to the from array', function() {
		qb.resetQuery();
		qb.from('universe').from('galaxy').from('star_system').from('planet');
		qb.fromArray.should.eql(['`universe`','`galaxy`','`star_system`','`planet`']);
	});
	it('should accept an array of items and add them individually to the from array', function() {
		qb.resetQuery();
		qb.from(['universe','galaxy','star_system','planet']);
		qb.fromArray.should.eql(['`universe`','`galaxy`','`star_system`','`planet`']);
	});
	it('should not double-escape an item', function() { 
		qb.resetQuery();
		qb.from('`do`');
		qb.fromArray.should.eql(['`do`']);
	});
	it('should not double-escape items when provided with an array of pre-escaped items', function() { 
		qb.resetQuery();
		qb.from(['`universe`','`galaxy`','`star_system`']);
		qb.fromArray.should.eql(['`universe`','`galaxy`','`star_system`']);
	});
	it('should not double-escape items when provided with an array of pre-escaped items but should escpae non-pre-escaped items', function() { 
		qb.resetQuery();
		qb.from(['`universe`','galaxy','`star_system`']);
		qb.fromArray.should.eql(['`universe`','`galaxy`','`star_system`']);
	});
	it('should allow for aliases and it should escape them properly', function() {
		qb.resetQuery();
		qb.from('universe u');
		qb.fromArray.should.eql(['`universe` `u`']);
	});
	it('should allow for the word AS to be used to alias an item', function() {
		qb.resetQuery();
		qb.from('universe as u');
		qb.fromArray.should.eql(['`universe` as `u`']);
	});
	it('should allow for an array of item + aliases and it should escape them all properly', function() {
		qb.resetQuery();
		qb.from(['universe u', 'galaxy g']);
		qb.fromArray.should.eql(['`universe` `u`','`galaxy` `g`']);
	});
	it('should allow for an array of item + aliases that are pre-escaped and it should not double-escape them', function() {
		qb.resetQuery();
		qb.from(['`universe` `u`', '`galaxy` `g`']);
		qb.fromArray.should.eql(['`universe` `u`','`galaxy` `g`']);
	});
	it('should allow for an array of item + aliases where some are pre-escaped and it should not double-escape pre-escaped items', function() {
		qb.resetQuery();
		qb.from(['`universe` u', 'galaxy `g`']);
		qb.fromArray.should.eql(['`universe` `u`','`galaxy` `g`']);
	});
	it('should add aliases to alias-tracking array', function() {
		qb.resetQuery();
		qb.from(['`universe` `u`', '`galaxy` `g`']);
		qb.aliasedTables.should.eql(['`universe` `u`','`galaxy` `g`']);
	});
	it('should allow for an comma-delimited list of item + aliases and it should escape them all properly', function() {
		qb.resetQuery();
		qb.from(['universe u, galaxy g']);
		qb.fromArray.should.eql(['`universe` `u`','`galaxy` `g`']);
	});
});