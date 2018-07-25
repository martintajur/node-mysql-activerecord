const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mssql/query_builder.js');
const qb = new QueryBuilder();

describe('MSSQL: having()', () => {
    it('should exist', () => {
        should.exist(qb.having);
    });
    it('should be a function', () => {
        qb.having.should.be.a('function');
    });
    it('should have an array to put fields into', () => {
        qb.should.have.property('having_array');
    });
    it('should accept a string only in this format: a [>|<|<>|>=|<=|=|!=] b for the first parameter', () => {
        qb.reset_query();
        qb.having('planet_class > "M"');
        qb.having_array.should.eql(["[planet_class] > 'M'"]);

        qb.reset_query();
        qb.having('planet_class < "M"');
        qb.having_array.should.eql(["[planet_class] < 'M'"]);

        qb.reset_query();
        qb.having('planet_class <> "M"');
        qb.having_array.should.eql(["[planet_class] <> 'M'"]);

        qb.reset_query();
        qb.having('planet_class >= "M"');
        qb.having_array.should.eql(["[planet_class] >= 'M'"]);

        qb.reset_query();
        qb.having('planet_class <= "M"');
        qb.having_array.should.eql(["[planet_class] <= 'M'"]);

        qb.reset_query();
        qb.having('planet_class = "M"');
        qb.having_array.should.eql(["[planet_class] = 'M'"]);

        qb.reset_query();
        qb.having('planet_class != "M"');
        qb.having_array.should.eql(["[planet_class] != 'M'"]);
    });
    it('should not accept compound conditions in this format: a [>|<|<>|>=|<=|=|!=] b[, repeat[, etc...]]', () => {
        qb.reset_query();
        expect(() => qb.having('planet_class = "M", sentient_life = 1'), 'two conditions provided').to.throw(Error);
    });
    it('should accept an array of conditions and prepend AND to each condition following the first one', () => {
        qb.reset_query();
        qb.having(["planet_class = 'M'", 'sentient_life = 1']);
        qb.having_array.should.eql(["[planet_class] = 'M'", 'AND [sentient_life] = 1']);
    });
    it('should accept an object of conditions and prepend AND to each condition following the first one', () => {
        qb.reset_query();
        const object = {planet_class: 'M', sentient_life: 1};
        object['planet_order <='] = 3;
        qb.having(object);
        qb.having_array.should.eql(["[planet_class] = 'M'", 'AND [sentient_life] = 1','AND [planet_order] <= 3']);
    });
    it('should not accept anything but a non-empty array, object, or string', () => {
        qb.reset_query();
        expect(() => qb.group_by(), 'nothing provided').to.throw(Error);
        expect(() => qb.group_by(null), 'null provided').to.throw(Error);
        expect(() => qb.group_by(false), 'false provided').to.throw(Error);
        expect(() => qb.group_by(true), 'true provided').to.throw(Error);
        expect(() => qb.group_by({}), 'empty object provided').to.throw(Error);
        expect(() => qb.group_by(3), 'integer provided').to.throw(Error);
        expect(() => qb.group_by(3.5), 'float provided').to.throw(Error);
        expect(() => qb.group_by([]), 'empty array provided').to.throw(Error);
        expect(() => qb.group_by([1,2]), 'array of numbers provided').to.throw(Error);
        expect(() => qb.group_by(''), 'empty string provided').to.throw(Error);

        // valid string
        expect(() => qb.group_by('planet_type = "M"'), 'valid string provided').to.not.throw(Error);
        expect(() => qb.group_by(['planet_type = "M"']), 'array of string(s) provided').to.not.throw(Error);
    });
    it('should accept 2 parameters where the first one is the field with optional condition and the second one is the value', () => {
        qb.reset_query();
        qb.having('planet_class','M');
        qb.having_array.should.eql(["[planet_class] = 'M'"]);
    });
    it('should not escape conditions if asked not to', () => {
        qb.reset_query();
        qb.having(["planet_class = 'M'", 'sentient_life = 1'], null, false);
        qb.having_array.should.eql(["planet_class = 'M'", 'AND sentient_life = 1']);
    });
    it('should be chainable', () => {
        qb.reset_query();
        qb.having('planet_class','M').having('sentient_life',true).having('planet_order <=',3);
        qb.having_array.should.eql(["[planet_class] = 'M'", 'AND [sentient_life] = 1','AND [planet_order] <= 3']);
    });
});

describe('MSSQL: or_having()', () => {
    it('should exist', () => {
        should.exist(qb.or_having);
    });
    it('should be a function', () => {
        qb.or_having.should.be.a('function');
    });
    it('should accept an array of conditions and prepend OR to each condition following the first one', () => {
        qb.reset_query();
        qb.or_having(["planet_class = 'M'", 'sentient_life = 1']);
        qb.having_array.should.eql(["[planet_class] = 'M'", 'OR [sentient_life] = 1']);
    });
    it('should be chainable with normal having', () => {
        qb.reset_query();
        qb.having('planet_class','M').having('sentient_life',true).or_having('planet_order <=',3);
        qb.having_array.should.eql(["[planet_class] = 'M'", 'AND [sentient_life] = 1','OR [planet_order] <= 3']);
    });
});
