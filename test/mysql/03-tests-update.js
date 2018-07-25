const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mysql/query_builder.js');
const qb = new QueryBuilder();

const test_where = {id:3};
const test_data = {name:'Milky Way', type: 'spiral'};
const test_data_set = [{id:3, name:'Milky Way', type: 'spiral'}, {id:4, name: 'Andromeda', type: 'spiral'}];

// table, data, callback, ignore, suffix

describe('MySQL: update()', () => {
    it('should exist', () => {
        should.exist(qb.update);
    });
    it('should be a function', () => {
        qb.update.should.be.a('function');
    });
    it('should add a table to from_array when a table is supplied', () => {
        qb.reset_query();
        qb.update('galaxies', test_data, test_where);
        qb.from_array.should.eql(['`galaxies`']);
    });
    it('should accept a string or falsy value for the table (first) parameter', () => {
        qb.reset_query();

        // One could choose to pass a falsy value to the first param because they have or will
        // supply it with the from() method instead.

        qb.reset_query(); expect(() => qb.from('galaxies').update([], test_data), 'empty array provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.from('galaxies').update({}, test_data), 'empty object provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.from('galaxies').update(3, test_data), 'integer provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.from('galaxies').update(3.5, test_data), 'float provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.from('galaxies').update(true, test_data), 'true provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.from('galaxies').update(Infinity, test_data), 'Infinity provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.from('galaxies').update([1,2], test_data), 'array of numbers provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.from('galaxies').update(/foobar/, test_data), 'regex provided').to.throw(Error);

        qb.reset_query(); expect(() => qb.from('galaxies').update(NaN, test_data), 'NaN provided').to.not.throw(Error);
        qb.reset_query(); expect(() => qb.from('galaxies').update(false, test_data), 'false provided').to.not.throw(Error);
        qb.reset_query(); expect(() => qb.from('galaxies').update('', test_data), 'empty string provided').to.not.throw(Error);
        qb.reset_query(); expect(() => qb.from('galaxies').update('  ', test_data), 'string full of spaces provided').to.not.throw(Error);
        qb.reset_query(); expect(() => qb.from('galaxies').update(null, test_data), 'null provided').to.not.throw(Error);
        qb.reset_query(); expect(() => qb.from('galaxies').update(undefined, test_data),'undefined provided').to.not.throw(Error);
    });
    it('should fail if a number, non-standard object, regex, boolean, array of non-objects, or non-empty string is provided in data parameter', () => {
        // One could choose to pass a falsy value to the second param because they have or will
        // supply data with the set() method instead.

        qb.reset_query(); expect(() => qb.update('galaxies',test_data), 'non-empty array provided').to.not.throw(Error);
        qb.reset_query(); expect(() => qb.update('galaxies',test_data_set), 'array of non-empty standard objects provided').to.not.throw(Error);

        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies',NaN), 'NaN provided').to.not.throw(Error);
        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies',false), 'false provided').to.not.throw(Error);
        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies',''), 'empty string provided').to.not.throw(Error);
        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies',null), 'null provided').to.not.throw(Error);
        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies',undefined), 'undefined provided').to.not.throw(Error);
        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies'), 'nothing provided').to.not.throw(Error);

        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies',3), 'integer provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies',3.5), 'float provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies',true), 'true provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies',Infinity), 'Infinity provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.set({id:2}).update('foobar',{}), 'empty object provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies',[{},{}]), 'array of empty objects provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies',[]), 'empty array provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies',[1,2]), 'array of numbers provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies',['abc',2,{foo:'bar'}]), 'array of mixed values provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies',/foobar/), 'regex provided').to.throw(Error);
        qb.reset_query(); expect(() => qb.set({id:2}).update('galaxies','  '), 'string full of spaces provided').to.throw(Error);
    });
    it('should require that there is at least something being updated', () => {
        // @todo
    });
    it('should utilize pre-existing tables set in from_array', () => {
        qb.reset_query();
        qb.from('galaxies');
        const sql = qb.update(null, test_data, test_where);
        sql.should.eql("UPDATE (`galaxies`) SET `name` = 'Milky Way', `type` = 'spiral' WHERE `id` = 3");
    });
    it('should utilize pre-existing value set in in set_array', () => {
        qb.reset_query();
        qb.set(test_data);
        const sql = qb.update('galaxies');
        sql.should.eql("UPDATE (`galaxies`) SET `name` = 'Milky Way', `type` = 'spiral'");
    });
    it('should utilize pre-existing tables and values from from_aray and set_array, respectively', () => {
        qb.reset_query();
        qb.from('galaxies').set(test_data);
        const sql = qb.update();
        sql.should.eql("UPDATE (`galaxies`) SET `name` = 'Milky Way', `type` = 'spiral'");
    });
    it('should accept a non-empty object for the data parameter', () => {
        qb.reset_query();
        const sql = qb.update('galaxies', test_data);
        sql.should.eql("UPDATE (`galaxies`) SET `name` = 'Milky Way', `type` = 'spiral'");
    });
    it('should convert call to update_batch() if an array of non-emtpy objects is passed in the data parameter', () => {
        qb.reset_query();
        const sql = qb.update('galaxies', test_data_set);
        qb.reset_query();
        const sql_b = qb.update_batch('galaxies', test_data_set, 'id');
        sql.should.eql(sql_b);
    });
    it('should fail if any invalid values are passed in the data object.', () => {
        qb.reset_query();
        const func = () => console.log("foo");
        const regex = /foobar/;
        const arr = [1,2,3];
        const obj = {foo: 'bar'};

        qb.reset_query(); expect(() => qb.update('galaxies',{id: func}), 'function in data').to.throw(Error);
        qb.reset_query(); expect(() => qb.update('galaxies',{id: regex}), 'regex in data').to.throw(Error);
        qb.reset_query(); expect(() => qb.update('galaxies',{id: Infinity}), 'Infinity in data').to.throw(Error);
        qb.reset_query(); expect(() => qb.update('galaxies',{id: undefined}), 'undefined in data').to.throw(Error);
        qb.reset_query(); expect(() => qb.update('galaxies',{id: NaN}), 'NaN in data').to.throw(Error);
        qb.reset_query(); expect(() => qb.update('galaxies',{id: arr}), 'array in data').to.throw(Error);
        qb.reset_query(); expect(() => qb.update('galaxies',{id: obj}), 'object in data').to.throw(Error);

    });
});
