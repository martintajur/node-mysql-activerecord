TESTS = test/*.js
test:
	mocha --timeout 5000 --reporter markdown $(TESTS)
 
.PHONY: test
