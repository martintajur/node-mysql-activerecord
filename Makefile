TESTS = test/mysql/*.js test/mssql/*.js
#TESTS = test/mssql/05-tests-multiple-pools.js
#TESTS = test/05-multiple-drivers.js
test:
	mocha --timeout 5000 --reporter spec $(TESTS)

.PHONY: test
