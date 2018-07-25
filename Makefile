TESTS = test/mysql/*.js test/mssql/*.js
#TESTS = test/mssql/*.js
#TESTS = test/mssql/04-tests-query-response.js
#TESTS = test/mssql/05-tests-multiple-queries.js
#TESTS = test/mssql/03-tests-insert.js
test:
	mocha --timeout 5000 --reporter spec $(TESTS)

.PHONY: test
