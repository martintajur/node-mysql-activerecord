const should = require('chai').should();
const QueryBuilder = require('../../drivers/mssql/query_builder.js');
const qb = new QueryBuilder();

describe('MSSQL: from()', () => {
    it('should exist', () => {
        should.exist(qb.from);
    });
    it('should be a function', () => {
        qb.from.should.be.a('function');
    });
    it('should have an array to put fields into', () => {
        qb.should.have.property('from_array');
    });
    it('should have an empty array to put fields into at the beginning', () => {
        qb.from_array.should.be.empty;
    });
    it('should add an item to an array and escape it properly', () => {
        qb.from('universe');
        qb.from_array.should.eql(['[universe]']);
    })
    it('should accept a comma-delimited string of items and trim and escape each properly', () => {
        qb.reset_query();
        qb.from('universe,galaxy  ,  star_system, planet');
        qb.from_array.should.eql(['[universe]','[galaxy]','[star_system]','[planet]']);
    });
    it('should have an empty array after resetting', () => {
        qb.reset_query();
        qb.from_array.should.be.empty;
    });
    it('should be allowed to be called multiple times to add multiple items to the from array', () => {
        qb.reset_query();
        qb.from('universe').from('galaxy').from('star_system').from('planet');
        qb.from_array.should.eql(['[universe]','[galaxy]','[star_system]','[planet]']);
    });
    it('should accept an array of items and add them individually to the from array', () => {
        qb.reset_query();
        qb.from(['universe','galaxy','star_system','planet']);
        qb.from_array.should.eql(['[universe]','[galaxy]','[star_system]','[planet]']);
    });
    it('should not double-escape an item', () => {
        qb.reset_query();
        qb.from('[do]');
        qb.from_array.should.eql(['[do]']);
    });
    it('should not double-escape items when provided with an array of pre-escaped items', () => {
        qb.reset_query();
        qb.from(['[universe]','[galaxy]','[star_system]']);
        qb.from_array.should.eql(['[universe]','[galaxy]','[star_system]']);
    });
    it('should not double-escape items when provided with an array of pre-escaped items but should escpae non-pre-escaped items', () => {
        qb.reset_query();
        qb.from(['[universe]','galaxy','[star_system]']);
        qb.from_array.should.eql(['[universe]','[galaxy]','[star_system]']);
    });
    it('should allow for aliases and it should escape them properly', () => {
        qb.reset_query();
        qb.from('universe u');
        qb.from_array.should.eql(['[universe] [u]']);
    });
    it('should allow for the word AS to be used to alias an item', () => {
        qb.reset_query();
        qb.from('universe as u');
        qb.from_array.should.eql(['[universe] as [u]']);
    });
    it('should allow for an array of item + aliases and it should escape them all properly', () => {
        qb.reset_query();
        qb.from(['universe u', 'galaxy g']);
        qb.from_array.should.eql(['[universe] [u]','[galaxy] [g]']);
    });
    it('should allow for an array of item + aliases that are pre-escaped and it should not double-escape them', () => {
        qb.reset_query();
        qb.from(['[universe] [u]', '[galaxy] [g]']);
        qb.from_array.should.eql(['[universe] [u]','[galaxy] [g]']);
    });
    it('should allow for an array of item + aliases where some are pre-escaped and it should not double-escape pre-escaped items', () => {
        qb.reset_query();
        qb.from(['[universe] u', 'galaxy [g]']);
        qb.from_array.should.eql(['[universe] [u]','[galaxy] [g]']);
    });
    it('should add aliases to alias-tracking array', () => {
        qb.reset_query();
        qb.from(['[universe] [u]', '[galaxy] [g]']);
        qb.aliased_tables.should.eql(['u','g']);
    });
    it('should allow for an comma-delimited list of item + aliases and it should escape them all properly', () => {
        qb.reset_query();
        qb.from(['universe u, galaxy g']);
        qb.from_array.should.eql(['[universe] [u]','[galaxy] [g]']);
    });
    it('should allow for namespacing in field name (host.db.table)', () => {
        qb.reset_query();
        qb.from('star_system.planet');
        qb.from_array.should.eql(['[star_system].[planet]']);

        qb.reset_query();
        qb.from('galaxy.star_system.planet');
        qb.from_array.should.eql(['[galaxy].[star_system].[planet]']);
    });
    it('should allow for namespacing in field name (host.db.table.column) + alias', () => {
        qb.reset_query();
        qb.from('universe.galaxy.star_system planet');
        qb.from_array.should.eql(['[universe].[galaxy].[star_system] [planet]']);
    });
    it('should allow for namespacing in field name (host.db.table.column) + alias (declare with AS)', () => {
        qb.reset_query();
        qb.from('universe.galaxy.star_system as planet');
        qb.from_array.should.eql(['[universe].[galaxy].[star_system] as [planet]']);
    });
    it('should accept but ignore empty strings and empty strings within arrays', () => {
        qb.reset_query();
        qb.from('');
        qb.from_array.should.be.empty;

        qb.reset_query();
        qb.from(['','']);
        qb.from_array.should.be.empty;

        qb.reset_query();
        qb.from(['','foobar']);
        qb.from_array.should.eql(['[foobar]']);
    });
});
