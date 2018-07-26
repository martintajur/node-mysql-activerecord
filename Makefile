TESTS = test/mysql/*.js test/mssql/*.js test/*.js
#TESTS = test/mysql/03-tests-update_batch.js
#TESTS = test/05-multiple-drivers.js
test:
	mocha --timeout 5000 --reporter spec $(TESTS)

.PHONY: test
