/**
 * [DRIVERNAME] Connection Library
 * Version 0.0.1
 *
 * [PUT DESCRIPTION HERE]
 *
 * Supported connection types:
 * - Single
 * - Pool
 * - PoolCluster
 *
 * Dependencies:
 *
**/

let connect, Standard, Pool, PoolCluster;

// ****************************************************************************
// Sets up a standard one-time connection (no pooling). This one is used by the
// other two methods to stay DRY.
// -----
// @param	Object	settings	Connection settings
// @return	Object				Connection handle
// ****************************************************************************
Standard = settings => {

};

// ****************************************************************************
// Sets up a connection pool
// -----
// @param	Object	settings	Connection settings
// @return	Object				Connection handle
// ****************************************************************************
Pool = settings => {

};

// ****************************************************************************
// Sets up a cluster of pooled connections  to different servers for load
// balancing and failover
// -----
// @param	Object	settings	Connection settings
// @return	Object				Connection handle
// ****************************************************************************
PoolCluster = settings => {

};

// ****************************************************************************
// Generic function for creating connections to databases
// -----
// @param	Object	settings	Connection settings (including the type)
// @return	Object				Connection handle
// ****************************************************************************
connect = (settings,type) => {
	type = type || 'single';

	let connection = null;

	switch(type) {
		case 'single':
			connection = Standard(settings);
			break;
		case 'pool':
			connection = Pool(settings);
			break;
		case 'cluster':
			connection = PoolCluster(settings);
			break;
		default:
			throw new Error("Invalid connection type specified!");
			break;
	}

	if (connection === null) {
		throw new Error("A connection could not be established!");
	}
	return connection;
}

exports.connect = connect;