var settings = {
    host: 'localhost',
    database: 'mydatabase',
    user: 'myuser',
    password: 'MyP@ssw0rd'
};
var nqb = require('node-querybuilder');
var pool = new QueryBuilder(settings, 'mysql', 'pool');

pool.get_connection(function(qb) {
	qb.select('name', 'position')
		.where({type: 'rocky', 'diameter <': 12000})
		.get('planets', function(err,response) {
			if (err) return console.error("Uh oh! Couldn't get results: " + err.msg);

			// SELECT `name`, `position` FROM `planets` WHERE `type` = 'rocky' AND `diameter` < 12000
			console.log("Query Ran: " + qb.last_query());

			// [{name: 'Mercury', position: 1}, {name: 'Mars', position: 4}]
			console.dir(response);
		}
	);
});