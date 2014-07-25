// *****************************************************************************
// Setup MySQL DB
// *****************************************************************************
var mysql_ar = require('index.js');
var pool = new mysql_ar.Pool({
    server   : 'localhost',
	username : 'scripts',
	password : '2B||!2B',
	database : 'iti',
	insecureAuth: true
});
pool.getNewAdapter(function(db) {
	db.query('SELECT 1', function(err,rows) {
		if(err != undefined) {
			logger.error("Could not connect to DB! " + err);
			process.exit(1);
		}
		db.releaseConnection();
	});
});

pool.getNewAdapter(function(db) {
	//db.like('department_id','7','after').like('first_name', 'Joh', 'after').where('is_current_employee',true).get('_employees e', function(err, rows) {
	//db.where('is_current_employee',true).where('first_name','Kyle').get('_employees e', function(err, rows) {
	//db.select('first_name as fname').where({is_current_employee: true,first_name: 'Kyle'}).get('_employees', function(err, rows) {
	/* db.from('_employees e')
	  .from('_departments d')
	  .where_in('department_id',[1,2,3,4])
	  .or_where_in('department_id',[5,6,7,'foobar'])
	  .where_not_in('e.hrid',123)
	  .join('iti._acl_super_admins asa','asa.emp_id=e.id','left')
	  .get(function(err, rows) {
		db.releaseConnection();
		if(err != undefined) {
			console.log("ERROR: " + err);
			console.log(db._last_query());
			process.exit(1);
		} else {
			//console.dir(rows);
			console.log(db._last_query());
		}
	}); */
	//db.select_sum('e.id','total_hrid').join('_departments d','d.id = e.department_id').get_where('_employees e',{'e.id':2380, 'e.is_current_employee': true}, function(err, rows) {
	/*db.select_sum('e.id','total_hrid')
      .join('_departments d','d.id = e.department_id','left')
	  .select(['first_name','last_name'])
	  .where('termination_date',null)
	  .get_where('_employees e',{
		'e.id':2380,
		'e.is_current_employee': true
	   }, function(err, row) {*/
	db.order_by('id asc').get('_employees e', function(err, rows) { 
		db.releaseConnection();
		if(err != undefined) {
			console.log("ERROR: " + err);
			console.log(db._last_query());
			process.exit(1);
		} else {
			//console.dir(rows);
			console.log(db._last_query());
		}
	});
});