const configs = {
    mysql: {
        host: '127.0.0.1',
        database: 'mock_db',
        user: 'travis',
        version: '2.5.4',
        port: 3306,
        debug: false,
    },
    mssql: {
        host: 'localhost',
        database: 'mock_db',
        user: 'travis',
        password: 'Password123',
        version: '4.1.0',
        port: 1433,
        options: {
            encrypt: false
        }
    },
};
module.exports = configs;
