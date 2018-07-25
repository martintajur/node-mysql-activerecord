const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mysql/query_builder.js');
const qb = new QueryBuilder();

describe('MySQL: set()', () => {
    it('should exist', () => {
        should.exist(qb.set);
    });
    it('should be a function', () => {
        qb.set.should.be.a('function');
    });
    it('should have an object to put fields into', () => {
        qb.should.have.property('set_array');
    });
    it('should have an empty array to put fields into at the beginning', () => {
        qb.set_array.should.be.empty;
    });
    it('should not accept anything but a non-empty string or a non-empty object as first param', () => {
        qb.reset_query();
        expect(() => qb.set(), 'nothing provided').to.throw(Error);
        expect(() => qb.set(null), 'null provided').to.throw(Error);
        expect(() => qb.set(false), 'false provided').to.throw(Error);
        expect(() => qb.set(true), 'true provided').to.throw(Error);
        expect(() => qb.set({}), 'empty object provided').to.throw(Error);
        expect(() => qb.set(3), 'integer provided').to.throw(Error);
        expect(() => qb.set(3.5), 'float provided').to.throw(Error);
        expect(() => qb.set(NaN), 'NaN provided').to.throw(Error);
        expect(() => qb.set(Infinity), 'Infinity provided').to.throw(Error);
        expect(() => qb.set([]), 'empty array provided').to.throw(Error);
        expect(() => qb.set([1,2]), 'array of numbers provided').to.throw(Error);
        expect(() => qb.set(''), 'empty string provided').to.throw(Error);
        expect(() => qb.set('  '), 'string full of spaces provided').to.throw(Error);
        expect(() => qb.set(/foobar/), 'regex provided').to.throw(Error);

        expect(() => qb.set('planet_position',3), 'valid string provided').to.not.throw(Error);
        expect(() => qb.set({planet_position: 3}), 'valid object provided').to.not.throw(Error);
    });
    it('should not accept anything but a string, number, date, null, or boolean as second param if first param is a string.', () => {
        qb.reset_query();
        expect(() => qb.set('planet_position'), 'nothing provided').to.throw(Error);
        expect(() => qb.set('planet_position',{}), 'empty object provided').to.throw(Error);
        expect(() => qb.set('planet_position',NaN), 'NaN provided').to.throw(Error);
        expect(() => qb.set('planet_position',Infinity), 'Infinity provided').to.throw(Error);
        expect(() => qb.set('planet_position',[]), 'empty array provided').to.throw(Error);
        expect(() => qb.set('planet_position',[1,2]), 'array of numbers provided').to.throw(Error);
        expect(() => qb.set('planet_position',/foobar/), 'regex provided').to.throw(Error);

        expect(() => qb.set('planet_position',new Date()), 'date provided').to.not.throw(Error);
        expect(() => qb.set('planet_position',null), 'null provided').to.not.throw(Error);
        expect(() => qb.set('planet_position',3), 'Integer provided').to.not.throw(Error);
        expect(() => qb.set('planet_position',3.5), 'float provided').to.not.throw(Error);
        expect(() => qb.set('planet_position',false), 'false provided').to.not.throw(Error);
        expect(() => qb.set('planet_position',true), 'true provided').to.not.throw(Error);
        expect(() => qb.set('planet_position',''), 'empty string provided').to.not.throw(Error);
        expect(() => qb.set('planet_position','  '), 'string full of spaces provided').to.not.throw(Error);
        expect(() => qb.set('planet_position','Three'), 'non-empty string provided').to.not.throw(Error);
    });
    it('should add first param (key) and second param (value) to hash and escape them properly', () => {
        qb.reset_query();
        qb.set('galaxy_name','Milky Way');
        qb.set_array.should.eql([{"`galaxy_name`": "'Milky Way'"}]);
    });
    it('should merge passed object into set_array and escape items properly', () => {
        qb.reset_query();
        qb.set({galaxy_name: 'Milky Way'});
        qb.set_array.should.eql([{"`galaxy_name`": "'Milky Way'"}]);

        qb.reset_query();
        qb.set({galaxy_name: 'Milky Way', galaxy_class: 'C'});
        qb.set_array.should.eql([{"`galaxy_name`": "'Milky Way'"}, {"`galaxy_class`": "'C'"}]);
    });
    it('should not escape items if asked not to', () => {
        qb.reset_query();
        qb.set({galaxy_name: 'Milky Way'}, null, false);
        qb.set_array.should.eql([{galaxy_name: 'Milky Way'}]);
    });
    it('should append more items to set_array as set() is called', () => {
        qb.reset_query();
        qb.set({galaxy_name: 'Milky Way'}, null, false);
        qb.set({galaxy_class: 'C'}, null, false);
        qb.set('galaxy_size','D');
        qb.set_array.should.eql([{galaxy_name: 'Milky Way'}, {galaxy_class: 'C'}, {"`galaxy_size`": "'D'"}]);
    });
    it('should be chainable', () => {
        qb.reset_query();
        qb.set({galaxy_name: 'Milky Way', galaxy_class: 'C'}, null, false).set('galaxy_size','D');
        qb.set_array.should.eql([{galaxy_name: 'Milky Way'}, {galaxy_class: 'C'}, {"`galaxy_size`": "'D'"}]);
    });
    it('should overwrite values of keys that have been set already', () => {
        qb.reset_query();
        qb.set({galaxy_name: 'Milky Way'}, null, false);
        qb.set({galaxy_class: 'C'});
        qb.set('galaxy_class','D');
        qb.set_array.should.eql([{galaxy_name: 'Milky Way'}, {"`galaxy_class`": "'D'"}]);
    });
    it('should NOT overwrite values of keys that are the same but have different escape flags', () => {
        qb.reset_query();
        qb.set({galaxy_name: 'Milky Way'}, null, false);
        qb.set({galaxy_class: 'C'});
        qb.set('galaxy_class','D', false);
        qb.set_array.should.eql([{galaxy_name: 'Milky Way'}, {"`galaxy_class`": "'C'"}, {galaxy_class: 'D'}]);
    });
});
