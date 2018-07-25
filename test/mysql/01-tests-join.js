const should = require('chai').should();
const expect = require('chai').expect;
const QueryBuilder = require('../../drivers/mysql/query_builder.js');
const qb = new QueryBuilder();

describe('MySQL: join()', () => {
    it('should exist', () => {
        should.exist(qb.join);
    });
    it('should be a function', () => {
        qb.join.should.be.a('function');
    });
    it('should have an array to put fields into', () => {
        qb.should.have.property('join_array');
    });
    it('should have an empty array to put fields into at the beginning', () => {
        qb.join_array.should.be.empty;
    });
    it('should require a string to be passed as first parameter', () => {
        const invalid_match = /must provide a table/;
        expect(() => qb.join(), 'nothing provided').to.throw(Error, invalid_match);
        expect(() => qb.join(true), 'true provided').to.throw(Error, invalid_match);
        expect(() => qb.join(null), 'null provided').to.throw(Error, invalid_match);
        expect(() => qb.join(false), 'false provided').to.throw(Error, invalid_match);
        expect(() => qb.join({}), 'object provided').to.throw(Error, invalid_match);
        expect(() => qb.join([]), 'empty array provided').to.throw(Error, invalid_match);
        expect(() => qb.join(''), 'empty string provided').to.throw(Error, invalid_match);
        expect(() => qb.join('  '), 'string of spaces provided').to.throw(Error, invalid_match);
        expect(() => qb.join('foo'), 'valid string provided').to.not.throw(Error);
        expect(() => qb.join('foo'), 'valid string provided').to.not.throw(Error);
    });
    it('should except single item and add it to join array as basic join and escape item', () => {
        qb.reset_query();
        qb.join('universe');
        qb.join_array.should.eql(['JOIN `universe`']);
    });
    it('should except single item with alias and add it to join array as basic join and escape each part', () => {
        qb.reset_query();
        qb.join('universe u');
        qb.join_array.should.eql(['JOIN `universe` `u`']);
    });
    it('should allow a string (and only a string) to be passed as second parameter but only if a valid (or no) third parameter is provided', () => {
        const invalid_2nd_param = /You must provide a valid condition to join on when providing a join direction/;
        const invalid_direction = /Invalid join direction provided as third parameter/;

        expect(() => qb.join('universe',null,'left'), 'null 2nd param').to.throw(Error,invalid_2nd_param);
        expect(() => qb.join('universe',false,'left'), 'false 2nd param').to.throw(Error,invalid_2nd_param);
        expect(() => qb.join('universe','','left'), 'empty string 2nd param').to.throw(Error,invalid_2nd_param);
        expect(() => qb.join('universe','   ','left'), 'just spaces 2nd param').to.throw(Error,invalid_2nd_param);
        expect(() => qb.join('universe',5,'left'), 'integer 2nd param').to.throw(Error,invalid_2nd_param);
        expect(() => qb.join('universe',5.6,'left'), 'float 2nd param').to.throw(Error,invalid_2nd_param);
        expect(() => qb.join('universe',[],'left'), 'array 2nd param').to.throw(Error,invalid_2nd_param);
        expect(() => qb.join('universe',{},'left'), 'object 2nd param').to.throw(Error,invalid_2nd_param);
        expect(() => qb.join('universe','foo = bar','fake'), 'invalid 3rd param').to.throw(Error,invalid_direction);
        expect(() => qb.join('universe','foo = bar'), 'no 3rd param').to.not.throw(Error);
        expect(() => qb.join('universe','foo = bar','left'), '3 valid params').to.not.throw(Error);
    });
    it('should allow valid join direction to be passed in third parameter', () => {
        // NOTE: A lot of this functionality was already tested when testing second param
        const invalid_direction = /Invalid join direction provided as third parameter/;

        expect(() => qb.join('universe','foo = bar','fake'), 'invalid 3rd param').to.throw(Error,invalid_direction);
        expect(() => qb.join('universe',null,null), 'invalid 2nd and 3rd params').to.not.throw(Error);
        expect(() => qb.join('universe','foo = bar',''), 'empty third param').to.not.throw(Error);
        expect(() => qb.join('universe','foo = bar','   '), 'just spaces').to.not.throw(Error);
        expect(() => qb.join('universe','foo = bar',null), 'null third param').to.not.throw(Error);
        expect(() => qb.join('universe','foo = bar',false), 'false third param').to.not.throw(Error);
        expect(() => qb.join('universe','foo = bar',5), 'integer third param').to.not.throw(Error);
        expect(() => qb.join('universe','foo = bar',5.5), 'float third param').to.not.throw(Error);
        expect(() => qb.join('universe','foo = bar',{}), 'object third param').to.not.throw(Error);
        expect(() => qb.join('universe','foo = bar',[]), 'array third param').to.not.throw(Error);
        expect(() => qb.join('universe','foo = bar','left  '), 'trailing space').to.not.throw(Error);
        expect(() => qb.join('universe','foo = bar',' left '), 'leading and trailing space').to.not.throw(Error);
        expect(() => qb.join('universe','foo = bar','  left'), 'leading space').to.not.throw(Error);
        expect(() => qb.join('universe','foo = bar','left'), 'lowercase direction').to.not.throw(Error);
        expect(() => qb.join('universe','foo = bar','LEFT'), 'uppercase direction').to.not.throw(Error);
        expect(() => qb.join('universe','foo = bar','LEFT OUTER'), 'two word direction').to.not.throw(Error);
    });
    it('should except a valid second parameter as a join condition and escape it properly', () => {
        qb.reset_query();
        qb.join('universe u','u.type_id = ut.id');
        qb.join_array.should.eql(['JOIN `universe` `u` ON `u`.`type_id` = `ut`.`id`']);
    });
    it('should escape compound objects properly', () => {
        qb.reset_query();
        qb.join('universe.galaxy.star_system s','s.type_id = st.id');
        qb.join_array.should.eql(['JOIN `universe`.`galaxy`.`star_system` `s` ON `s`.`type_id` = `st`.`id`']);
    });
    it('should add aliases to alias-tracking array', () => {
        qb.reset_query();
        qb.join('universe.galaxy.star_system s');
        qb.aliased_tables.should.eql(['s']);
    });
    it('should properly place join direction into join clause', () => {
        qb.reset_query();
        qb.join('universe.galaxy.star_system s', 's.type_id = st.id', 'left outer');
        qb.join_array.should.eql(['LEFT OUTER JOIN `universe`.`galaxy`.`star_system` `s` ON `s`.`type_id` = `st`.`id`']);
    });
    it('should be chainable to allow for multiple join clauses', () => {
        qb.reset_query();
        qb.join('star_system s', 's.type_id = st.id', 'left outer').join('planets p','p.star_system_id = s.id','left');
        qb.join_array.should.eql(['LEFT OUTER JOIN `star_system` `s` ON `s`.`type_id` = `st`.`id`', 'LEFT JOIN `planets` `p` ON `p`.`star_system_id` = `s`.`id`']);
    });
    it('should escape complex join conditions', () => {
        qb.reset_query();
        qb.join('star_system s', "s.type_id = st.id AND st.active = 1 AND st.created_on > '2014-01-01'", 'left');
        qb.join_array.should.eql(["LEFT JOIN `star_system` `s` ON `s`.`type_id` = `st`.`id` AND `st`.`active` = 1 AND `st`.`created_on` > '2014-01-01'"]);
    });
    it('should escape complex join conditions when there is `or` in the right-hand side of the condition', () => {
        qb.reset_query();
        qb.join('star_system s', " st.type = 'foo or bar' AND s.type_id = st.id", 'left');
        qb.join_array.should.eql(["LEFT JOIN `star_system` `s` ON `st`.`type` = 'foo or bar' AND `s`.`type_id` = `st`.`id`"]);
    });
    it('should escape complex join conditions when there is `and` in the right-hand side of the condition', () => {
        qb.reset_query();
        qb.join('star_system s', "st.type = 'foo and bar' AND s.type_id = st.id", 'left');
        qb.join_array.should.eql(["LEFT JOIN `star_system` `s` ON `st`.`type` = 'foo and bar' AND `s`.`type_id` = `st`.`id`"]);
    });
    it('should NOT escape any part of join query when asked not to', () => {
        qb.reset_query();
        qb.join('star_system s', "s.type_id = st.id AND st.active = 1 AND st.created_on > '2014-01-01'", 'left', false);
        qb.join_array.should.eql(["LEFT JOIN star_system s ON s.type_id = st.id AND st.active = 1 AND st.created_on > '2014-01-01'"]);
    });
});
