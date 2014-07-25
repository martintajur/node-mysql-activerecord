var should = require('chai').should();
var expect = require('chai').expect;
var QueryBuilder = require('../lib/query_builder.js');
var qb = new QueryBuilder();

describe('select()', function() {
	it('should exist', function() {
		should.exist(qb.select);
	});
	it('should be a function', function() {
		qb.select.should.be.a('function');
	});
	it('should have an array to put fields into', function() {
		qb.should.have.property('selectArray');
	});
	it('should have an empty array to put fields into at the beginning', function() {
		qb.selectArray.should.be.empty;
	});
	it('should require an array or string to be passed as first parameter', function() {
		var invalid_match = /requires a string or array/;
		var empty_str_match = /string is empty/;
		var empty_arr_match = /array is empty/;
		expect(function() { qb.select(); 	 	}, 'nothing provided').to.throw(Error, invalid_match);
		expect(function() { qb.select(true); 	}, 'true provided').to.throw(Error, invalid_match);
		expect(function() { qb.select(null); 	}, 'null provided').to.throw(Error, invalid_match);
		expect(function() { qb.select(false);	}, 'false provided').to.throw(Error, invalid_match);
		expect(function() { qb.select({}); 	 	}, 'object provided').to.throw(Error, invalid_match);
		expect(function() { qb.select([]); 	 	}, 'empty array provided').to.throw(Error, empty_arr_match);
		expect(function() { qb.select('');		}, 'empty string provided').to.throw(Error, empty_str_match);
		expect(function() { qb.select('  ');	}, 'string of spaces provided').to.throw(Error, empty_str_match);
		expect(function() { qb.select('blah'); 	}, 'valid string provided').to.not.throw(Error);
	});
	it('should add field to array and escape it properly', function() {
		qb.resetQuery();
		qb.select('notes');
		qb.selectArray.should.eql(['`notes`']);
	});
	it('should trim fields properly before placing them into the select array', function() {
		qb.resetQuery();
		qb.select('   notes         ');
		qb.selectArray.should.eql(['`notes`']);
	});
	it('should have an empty array after resetting', function() {
		qb.resetQuery();
		qb.selectArray.should.be.empty;
	});
	it('should not escape fields if asked not to', function() {
		qb.resetQuery();
		qb.select('foo',false);
		qb.selectArray.should.eql(['foo']);
	});
	it('should accept a comma-delimited string of field names and trim and escape each properly', function() {
		qb.resetQuery();
		qb.select('do,re  ,  mi, fa');
		qb.selectArray.should.eql(['`do`','`re`','`mi`','`fa`']);
	});
	it('should be allowed to be called multiple times to add multiple fields to the select array', function() {
		qb.resetQuery();
		qb.select('do').select('re').select('mi').select('fa');
		qb.selectArray.should.eql(['`do`','`re`','`mi`','`fa`']);
	});
	it('should be allowed to be called multiple times to add multiple escaped and/or non-escaped fields to the select array', function() {
		qb.resetQuery();
		qb.select('do').select('re',false).select('mi',false).select('fa');
		qb.selectArray.should.eql(['`do`','re','mi','`fa`']);
	});
	it('should accept an array of fields and add them individually to the select array', function() {
		qb.resetQuery();
		qb.select(['sol','la','ti','do']);
		qb.selectArray.should.eql(['`sol`','`la`','`ti`','`do`']);
	});
	it('should accept an array of fields and add them individually to the select array without escaping, if asked not to', function() {
		qb.resetQuery();
		qb.select(['sol','la','ti','do'],false);
		qb.selectArray.should.eql(['sol','la','ti','do']);
	});
	it('should accept an array of fields (some manually escaped) and add them individually to the select array without auto-escaping, if asked not to', function() {
		qb.resetQuery();
		qb.select(['`sol`','la','ti','`do`'],false);
		qb.selectArray.should.eql(['`sol`','la','ti','`do`']);
	});
	it('should not double-escape a field', function() { 
		qb.resetQuery();
		qb.select('`do`');
		qb.selectArray.should.eql(['`do`']);
	});
	it('should not double-escape fields when provided with an array of pre-escaped fields', function() { 
		qb.resetQuery();
		qb.select(['`do`','`re`','`mi`']);
		qb.selectArray.should.eql(['`do`','`re`','`mi`']);
	});
	it('should not double-escape fields when provided with an array of pre-escaped fields but should escpae non-pre-escaped fields', function() { 
		qb.resetQuery();
		qb.select(['`do`','re','`mi`']);
		qb.selectArray.should.eql(['`do`','`re`','`mi`']);
	});
	it('should allow for field aliases to be provided and those fields and aliases should be properly escaped', function() {
		qb.resetQuery();
		qb.select('foo as bar');
		qb.selectArray.should.eql(['`foo` as `bar`']);
	});
	it('should not double-escape aliases', function() {
		qb.resetQuery();
		qb.select(['foo as `bar`']);
		qb.selectArray.should.eql(['`foo` as `bar`']);
	});
	it('should allow for multiple fields with aliases to be provided and those fields and aliases should be properly escaped', function() {
		qb.resetQuery();
		qb.select(['foo as bar','bar as foo']);
		qb.selectArray.should.eql(['`foo` as `bar`','`bar` as `foo`']);
	});
	it('should allow for field aliases with spaces in them', function() {
		qb.resetQuery();
		qb.select('notes as The Notes');
		qb.selectArray.should.eql(['`notes` as `The Notes`']);
	});
	it('should allow for a comma-delimited list of fields with aliases to be provided and those fields and aliases should be properly escaped', function() {
		qb.resetQuery();
		qb.select('foo as bar, bar as foo, foobar as `Foo Bar`');
		qb.selectArray.should.eql(['`foo` as `bar`','`bar` as `foo`','`foobar` as `Foo Bar`']);
	});
});