var should = require('chai').should();
var expect = require('chai').expect;
var QueryBuilder = require('../lib/query_builder.js');
var qb = new QueryBuilder();

describe('set()', function() {
	it('should exist', function() {
		should.exist(qb.set);
	});
	it('should be a function', function() {
		qb.set.should.be.a('function');
	});
	it('should have an array to put fields into', function() {
		qb.should.have.property('setArray');
	});
	it('should have an empty array to put fields into at the beginning', function() {
		qb.setArray.should.be.empty;
	});
	it('should not accept anything but a non-empty string or a non-empty object as first param', function() {
		qb.resetQuery();
		expect(function() { qb.set(); 			}, 'nothing provided').to.throw(Error);
		expect(function() { qb.set(null); 		}, 'null provided').to.throw(Error);
		expect(function() { qb.set(false); 		}, 'false provided').to.throw(Error);
		expect(function() { qb.set(true); 		}, 'true provided').to.throw(Error);
		expect(function() { qb.set({}); 		}, 'empty object provided').to.throw(Error);
		expect(function() { qb.set(3); 			}, 'integer provided').to.throw(Error);
		expect(function() { qb.set(3.5); 		}, 'float provided').to.throw(Error);
		expect(function() { qb.set(NaN); 		}, 'NaN provided').to.throw(Error);
		expect(function() { qb.set(Infinity);	}, 'Infinity provided').to.throw(Error);
		expect(function() { qb.set([]); 		}, 'empty array provided').to.throw(Error);
		expect(function() { qb.set([1,2]); 		}, 'array of numbers provided').to.throw(Error);
		expect(function() { qb.set(''); 		}, 'empty string provided').to.throw(Error);
		expect(function() { qb.set('  '); 		}, 'string full of spaces provided').to.throw(Error);
		expect(function() { qb.set(/foobar/); 	}, 'regex provided').to.throw(Error);
		
		expect(function() { qb.set('planet_position',3);	}, 'valid string provided').to.not.throw(Error);
		expect(function() { qb.set({planet_position: 3}); 	}, 'valid object provided').to.not.throw(Error);
	});
	it('should not accept anything but a string, number, null, or boolean as second param', function() {
		qb.resetQuery();
		expect(function() { qb.set('planet_position'); 			}, 'nothing provided').to.throw(Error);
		expect(function() { qb.set('planet_position',{}); 		}, 'empty object provided').to.throw(Error);
		expect(function() { qb.set('planet_position',NaN); 		}, 'NaN provided').to.throw(Error);
		expect(function() { qb.set('planet_position',Infinity);	}, 'Infinity provided').to.throw(Error);
		expect(function() { qb.set('planet_position',[]); 		}, 'empty array provided').to.throw(Error);
		expect(function() { qb.set('planet_position',[1,2]); 	}, 'array of numbers provided').to.throw(Error);
		expect(function() { qb.set('planet_position',/foobar/); }, 'regex provided').to.throw(Error);
		
		expect(function() { qb.set('planet_position',null); 	}, 'null provided').to.not.throw(Error);
		expect(function() { qb.set('planet_position',3);		}, 'Integer provided').to.not.throw(Error);
		expect(function() { qb.set('planet_position',3.5); 		}, 'float provided').to.not.throw(Error);
		expect(function() { qb.set('planet_position',false); 	}, 'false provided').to.not.throw(Error);
		expect(function() { qb.set('planet_position',true); 	}, 'true provided').to.not.throw(Error);
		expect(function() { qb.set('planet_position',''); 		}, 'empty string provided').to.not.throw(Error);
		expect(function() { qb.set('planet_position','  '); 	}, 'string full of spaces provided').to.not.throw(Error);
		expect(function() { qb.set('planet_position','Three'); 	}, 'valid provided').to.not.throw(Error);
	});
	it('should add first param (key) and second param (value) to hash and escape them properly', function() {
		qb.resetQuery();
		qb.set('galaxy_name','Milky Way');
		qb.setArray.should.eql({"`galaxy_name`": "'Milky Way'"});
	});
	it('should merge passed object into setArray and escape items properly', function() {
		qb.resetQuery();
		qb.set({galaxy_name: 'Milky Way'});
		qb.setArray.should.eql({"`galaxy_name`": "'Milky Way'"});
		
		qb.resetQuery();
		qb.set({galaxy_name: 'Milky Way', galaxy_class: 'C'});
		qb.setArray.should.eql({"`galaxy_name`": "'Milky Way'", "`galaxy_class`": "'C'"});
	});
	it('should not escape items if asked not to', function() {
		qb.resetQuery();
		qb.set({galaxy_name: 'Milky Way'}, null, false);
		qb.setArray.should.eql({galaxy_name: 'Milky Way'});
	});
	it('should append more items to setArray as set() is called', function() {
		qb.resetQuery();
		qb.set({galaxy_name: 'Milky Way'}, null, false);
		qb.set({galaxy_class: 'C'}, null, false);
		qb.set('galaxy_size','D');
		qb.setArray.should.eql({galaxy_name: 'Milky Way', galaxy_class: 'C', "`galaxy_size`": "'D'"});
	});
	it('should be chainable', function() {
		qb.resetQuery();
		qb.set({galaxy_name: 'Milky Way', galaxy_class: 'C'}, null, false).set('galaxy_size','D');
		qb.setArray.should.eql({galaxy_name: 'Milky Way', galaxy_class: 'C', "`galaxy_size`": "'D'"});
	});
	it('should overwrite values of keys that have been set already', function() {
		qb.resetQuery();
		qb.set({galaxy_name: 'Milky Way'}, null, false);
		qb.set({galaxy_class: 'C'});
		qb.set('galaxy_class','D');
		qb.setArray.should.eql({galaxy_name: 'Milky Way', "`galaxy_class`": "'D'"});
	});
	it('should NOT overwrite values of keys that are the same but have different escape flags', function() {
		qb.resetQuery();
		qb.set({galaxy_name: 'Milky Way'}, null, false);
		qb.set({galaxy_class: 'C'});
		qb.set('galaxy_class','D', false);
		qb.setArray.should.eql({galaxy_name: 'Milky Way', "`galaxy_class`": "'C'", galaxy_class: 'D'});
	});
});