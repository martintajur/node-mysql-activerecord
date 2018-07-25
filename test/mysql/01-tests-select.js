const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mysql/query_builder.js');
const qb = new QueryBuilder();

describe('MySQL: select()', () => {
    it('should exist', () => {
        should.exist(qb.select);
    });
    it('should be a function', () => {
        qb.select.should.be.a('function');
    });
    it('should have an array to put fields into', () => {
        qb.should.have.property('select_array');
    });
    it('should have an empty array to put fields into at the beginning', () => {
        qb.select_array.should.be.empty;
    });
    it('should require an array or string to be passed as first parameter', () => {
        const invalid_match = /requires a string or array/;
        const empty_str_match = /string is empty/;
        const empty_arr_match = /array is empty/;
        expect(() => qb.select(), 'nothing provided').to.throw(Error, invalid_match);
        expect(() => qb.select(true), 'true provided').to.throw(Error, invalid_match);
        expect(() => qb.select(null), 'null provided').to.throw(Error, invalid_match);
        expect(() => qb.select(false), 'false provided').to.throw(Error, invalid_match);
        expect(() => qb.select({}), 'object provided').to.throw(Error, invalid_match);
        expect(() => qb.select([]), 'empty array provided').to.throw(Error, empty_arr_match);
        expect(() => qb.select(''), 'empty string provided').to.throw(Error, empty_str_match);
        expect(() => qb.select('  '), 'string of spaces provided').to.throw(Error, empty_str_match);
        expect(() => qb.select('blah'), 'valid string provided').to.not.throw(Error);
    });
    it('should add field to array and escape it properly', () => {
        qb.reset_query();
        qb.select('notes');
        qb.select_array.should.eql(['`notes`']);
    });
    it('should trim fields properly before placing them into the select array', () => {
        qb.reset_query();
        qb.select('   notes         ');
        qb.select_array.should.eql(['`notes`']);
    });
    it('should have an empty array after resetting', () => {
        qb.reset_query();
        qb.select_array.should.be.empty;
    });
    it('should not escape fields if asked not to', () => {
        qb.reset_query();
        qb.select('foo',false);
        qb.select_array.should.eql(['foo']);
    });
    it('should accept a comma-delimited string of field names and trim and escape each properly', () => {
        qb.reset_query();
        qb.select('do,re  ,  mi, fa');
        qb.select_array.should.eql(['`do`','`re`','`mi`','`fa`']);
    });
    it('should be allowed to be called multiple times to add multiple fields to the select array', () => {
        qb.reset_query();
        qb.select('do').select('re').select('mi').select('fa');
        qb.select_array.should.eql(['`do`','`re`','`mi`','`fa`']);
    });
    it('should be allowed to be called multiple times to add multiple escaped and/or non-escaped fields to the select array', () => {
        qb.reset_query();
        qb.select('do').select('re',false).select('mi',false).select('fa');
        qb.select_array.should.eql(['`do`','re','mi','`fa`']);
    });
    it('should accept an array of fields and add them individually to the select array', () => {
        qb.reset_query();
        qb.select(['sol','la','ti','do']);
        qb.select_array.should.eql(['`sol`','`la`','`ti`','`do`']);
    });
    it('should accept an array of fields and add them individually to the select array without escaping, if asked not to', () => {
        qb.reset_query();
        qb.select(['sol','la','ti','do'],false);
        qb.select_array.should.eql(['sol','la','ti','do']);
    });
    it('should accept an array of fields (some manually escaped) and add them individually to the select array without auto-escaping, if asked not to', () => {
        qb.reset_query();
        qb.select(['`sol`','la','ti','`do`'],false);
        qb.select_array.should.eql(['`sol`','la','ti','`do`']);
    });
    it('should not double-escape a field', () => {
        qb.reset_query();
        qb.select('`do`');
        qb.select_array.should.eql(['`do`']);
    });
    it('should not double-escape fields when provided with an array of pre-escaped fields', () => {
        qb.reset_query();
        qb.select(['`do`','`re`','`mi`']);
        qb.select_array.should.eql(['`do`','`re`','`mi`']);
    });
    it('should not double-escape fields when provided with an array of pre-escaped fields but should escpae non-pre-escaped fields', () => {
        qb.reset_query();
        qb.select(['`do`','re','`mi`']);
        qb.select_array.should.eql(['`do`','`re`','`mi`']);
    });
    it('should allow for field aliases to be provided and those fields and aliases should be properly escaped', () => {
        qb.reset_query();
        qb.select('foo as bar');
        qb.select_array.should.eql(['`foo` as `bar`']);
    });
    it('should not double-escape aliases', () => {
        qb.reset_query();
        qb.select(['foo as `bar`']);
        qb.select_array.should.eql(['`foo` as `bar`']);
    });
    it('should allow for multiple fields with aliases to be provided and those fields and aliases should be properly escaped', () => {
        qb.reset_query();
        qb.select(['foo as bar','bar as foo']);
        qb.select_array.should.eql(['`foo` as `bar`','`bar` as `foo`']);
    });
    it('should allow for field aliases with spaces in them', () => {
        qb.reset_query();
        qb.select('notes as The Notes');
        qb.select_array.should.eql(['`notes` as `The Notes`']);
    });
    it('should allow for a comma-delimited list of fields with aliases to be provided and those fields and aliases should be properly escaped', () => {
        qb.reset_query();
        qb.select('foo as bar, bar as foo, foobar as `Foo Bar`');
        qb.select_array.should.eql(['`foo` as `bar`','`bar` as `foo`','`foobar` as `Foo Bar`']);
    });
    it('should allow for namespacing in field name (host.db.table.field)', () => {
        qb.reset_query();
        qb.select('star_system.planet');
        qb.select_array.should.eql(['`star_system`.`planet`']);

        qb.reset_query();
        qb.select('galaxy.star_system.planet');
        qb.select_array.should.eql(['`galaxy`.`star_system`.`planet`']);

        qb.reset_query();
        qb.select('universe.galaxy.star_system.planet');
        qb.select_array.should.eql(['`universe`.`galaxy`.`star_system`.`planet`']);
    });
    it('should allow for namespacing in field name (host.db.table.column) + alias', () => {
        qb.reset_query();
        qb.select('universe.galaxy.star_system.planet as planet');
        qb.select_array.should.eql(['`universe`.`galaxy`.`star_system`.`planet` as `planet`']);
    });
    it('should not allow subqueries without the second parameter being false', () => {
        qb.reset_query();
        expect(
            () => qb.select('s.star_systems, (select count(p.*) as count from planets p where p.star_system_id IN(2,3,5)) as num_planets')
        ).to.throw(Error);

        expect(
            () => qb.select('s.star_systems, (select count(p.*) as count from planets p where p.star_system_id = 42) as num_planets')
        ).to.throw(Error);

        expect(
            () => qb.select('s.star_systems, (select count(p.*) as count from planets p where p.star_system_id IN(2,3,5)) as num_planets', false)
        ).to.not.throw(Error);
    });
    it('should not allow functions without the second paramter being false', () => {
        expect(
            () => qb.select('s.star_systems, count(planets) as num_planets')
        ).to.throw(Error);

        expect(
            () => qb.select('s.star_systems, if(num_planets > 0, true, false) as has_planets')
        ).to.throw(Error);


        expect(
            () => qb.select('s.star_systems, count(planets) as num_planets', false)
        ).to.not.throw(Error);

        expect(
            () => qb.select('s.star_systems, if(num_planets > 0, true, false) as has_planets', false)
        ).to.not.throw(Error);
    });
    it('should allow for functions and subqueries in statement without escaping them (aliases at the end will still be escaped)', () => {
        qb.reset_query();
        qb.select('count(*) as count', false);
        qb.select_array.should.eql(['count(*) AS `count`']);

        qb.reset_query();
        qb.select('count(*) as count, m.*, MIN(id) as min', false);
        qb.select_array.should.eql(['count(*) as count, m.*, MIN(id) AS `min`']);

        qb.reset_query();
        qb.select('(select count(p.*) as count from planets p) as num_planets', false);
        qb.select_array.should.eql(['(select count(p.*) as count from planets p) AS `num_planets`']);

        qb.reset_query();
        qb.select('s.star_systems, (select count(p.*) as count from planets p where p.star_system_id = s.id) as num_planets', false);
        qb.select_array.should.eql(['s.star_systems, (select count(p.*) as count from planets p where p.star_system_id = s.id) AS `num_planets`']);

    });
});
const prefixes = ['min','max','avg','sum'];
for (const i in prefixes) {
    const type = prefixes[i];
    describe('MySQL: select_' + type+'()', () => {
        it('should exist', () => {
            should.exist(qb['select_' + type]);
        });
        it('should be a function', () => {
            qb['select_' + type].should.be.a('function');
        });
        it('should place given field as parameter in a ' + type.toUpperCase() + '() MySQL function and alias the result with the original field name', () => {
            qb.reset_query();
            qb['select_' + type]('s.star_systems');
            qb.select_array.should.eql([type.toUpperCase() + '(`s`.`star_systems`) AS star_systems']);
        });
    });
}
