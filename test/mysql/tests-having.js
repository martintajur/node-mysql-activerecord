var should = require('chai').should();
var expect = require('chai').expect;
var qb = require('../../drivers/mysql/query_builder.js').QueryBuilder();

describe('having()', function() {
	it('should exist', function() {
		should.exist(qb.having);
	});
	it('should be a function', function() {
		qb.having.should.be.a('function');
	});
	it('should have an array to put fields into', function() {
		qb.should.have.property('having_array');
	});
	it('should accept a string only in this format: a [>|<|<>|>=|<=|=|!=] b for the first parameter', function() {
		qb.reset_query();
		qb.having('planet_class > "M"');
		qb.having_array.should.eql(["`planet_class` > 'M'"]);
		
		qb.reset_query();
		qb.having('planet_class < "M"');
		qb.having_array.should.eql(["`planet_class` < 'M'"]);
		
		qb.reset_query();
		qb.having('planet_class <> "M"');
		qb.having_array.should.eql(["`planet_class` <> 'M'"]);
		
		qb.reset_query();
		qb.having('planet_class >= "M"');
		qb.having_array.should.eql(["`planet_class` >= 'M'"]);
		
		qb.reset_query();
		qb.having('planet_class <= "M"');
		qb.having_array.should.eql(["`planet_class` <= 'M'"]);
		
		qb.reset_query();
		qb.having('planet_class = "M"');
		qb.having_array.should.eql(["`planet_class` = 'M'"]);
		
		qb.reset_query();
		qb.having('planet_class != "M"');
		qb.having_array.should.eql(["`planet_class` != 'M'"]);
	});
	it('should not accept compound conditions in this format: a [>|<|<>|>=|<=|=|!=] b[, repeat[, etc...]]', function() {
		qb.reset_query();
		expect(function() { qb.having('planet_class = "M", sentient_life = 1');	}, 'two conditions provided').to.throw(Error);
	});
	it('should accept an array of conditions and prepend AND to each condition following the first one', function() {
		qb.reset_query();
		qb.having(["planet_class = 'M'", 'sentient_life = 1']);
		qb.having_array.should.eql(["`planet_class` = 'M'", 'AND `sentient_life` = 1']);
	});
	it('should accept an object of conditions and prepend AND to each condition following the first one', function() {
		qb.reset_query();
		var object = {planet_class: 'M', sentient_life: 1};
		object['planet_order <='] = 3;
		qb.having(object);
		qb.having_array.should.eql(["`planet_class` = 'M'", 'AND `sentient_life` = 1','AND `planet_order` <= 3']);
	});
	it('should not accept anything but a non-empty array, object, or string', function() {
		qb.reset_query();
		expect(function() { qb.group_by(); 		}, 'nothing provided').to.throw(Error);
		expect(function() { qb.group_by(null); 	}, 'null provided').to.throw(Error);
		expect(function() { qb.group_by(false); }, 'false provided').to.throw(Error);
		expect(function() { qb.group_by(true); 	}, 'true provided').to.throw(Error);
		expect(function() { qb.group_by({}); 	}, 'empty object provided').to.throw(Error);
		expect(function() { qb.group_by(3); 	}, 'integer provided').to.throw(Error);
		expect(function() { qb.group_by(3.5); 	}, 'float provided').to.throw(Error);
		expect(function() { qb.group_by([]); 	}, 'empty array provided').to.throw(Error);
		expect(function() { qb.group_by([1,2]); }, 'array of numbers provided').to.throw(Error);
		expect(function() { qb.group_by(''); 	}, 'empty string provided').to.throw(Error);
		
		// valid string
		expect(function() { qb.group_by('planet_type = "M"');	}, 'valid string provided').to.not.throw(Error);
		expect(function() { qb.group_by(['planet_type = "M"']); }, 'array of string(s) provided').to.not.throw(Error);
	});
	it('should accept 2 parameters where the first one is the field with optional condition and the second one is the value', function() {
		qb.reset_query();
		qb.having('planet_class','M');
		qb.having_array.should.eql(["`planet_class` = 'M'"]);
	});
	it('should not escape conditions if asked not to', function() {
		qb.reset_query();
		qb.having(["planet_class = 'M'", 'sentient_life = 1'], null, false);
		qb.having_array.should.eql(["planet_class = 'M'", 'AND sentient_life = 1']);
	});
	it('should be chainable', function() {
		qb.reset_query();
		qb.having('planet_class','M').having('sentient_life',true).having('planet_order <=',3);
		qb.having_array.should.eql(["`planet_class` = 'M'", 'AND `sentient_life` = 1','AND `planet_order` <= 3']);
	});
});

describe('or_having()', function() {
	it('should exist', function() {
		should.exist(qb.or_having);
	});
	it('should be a function', function() {
		qb.or_having.should.be.a('function');
	});
	it('should accept an array of conditions and prepend OR to each condition following the first one', function() {
		qb.reset_query();
		qb.or_having(["planet_class = 'M'", 'sentient_life = 1']);
		qb.having_array.should.eql(["`planet_class` = 'M'", 'OR `sentient_life` = 1']);
	});
	it('should be chainable with normal having', function() {
		qb.reset_query();
		qb.having('planet_class','M').having('sentient_life',true).or_having('planet_order <=',3);
		qb.having_array.should.eql(["`planet_class` = 'M'", 'AND `sentient_life` = 1','OR `planet_order` <= 3']);
	});
});