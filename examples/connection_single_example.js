const settings = {
    host: 'localhost',
    database: 'mydatabase',
    user: 'myuser',
    password: 'MyP@ssw0rd'
};
const nqb = require('node-querybuilder');
const qb = new QueryBuilder(settings, 'mysql', 'single');

qb.select('name', 'position')
	.where({type: 'rocky', 'diameter <': 12000})
	.get('planets', (err,response) => {
		if (err) return console.error("Uh oh! Couldn't get results: " + err.msg);

		// SELECT `name`, `position` FROM `planets` WHERE `type` = 'rocky' AND `diameter` < 12000
		console.log("Query Ran: " + qb.last_query());

		// [{name: 'Mercury', position: 1}, {name: 'Mars', position: 4}]
		console.dir(response);
	}
);