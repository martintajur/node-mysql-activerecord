TESTS = test/mysql/*.js test/mssql/*.js
test:
	mocha --timeout 5000 --reporter spec $(TESTS)

.PHONY: test
