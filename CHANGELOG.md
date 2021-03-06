## 2.3.1
* Fixed bug that doesn't take in account the length of the current created function 

## 2.3.0
* Fixed bug that makes `$include` apply descriptors correctly 
* Added composition test
* **BEHAVIOR MIGHT CHANGE WHEN IMPLEMENTING/INCLUDING FUNCTIONS** 

## 2.2.1
* Changes to documentation, mostly `README.md`
* Fixed bug that makes `$implement` apply descriptors correctly 
* Performance tweaks

## 2.2.0
* Add `$wrap` method, makes any function or object an ES5Class
* Add `$const` for Object.defineProperty `writable: false`

## 2.1.2
* Improve `new` and `$create` operators performance

## 2.1.1
* Tests for the browser, change mocha to bdd. Testling doesn't work, but `index.html` test works
* Bump internal version

## 2.1.0
* 100% test coverage
* `$className` available in instance as well

## 2.0.1
* Fix tests for Travis and Testling
* Drop Node.js 0.8 support

## 2.0.0
* Bump version for major API changes and isn't backwards compatible
* Rewrite some tests
* 100% test coverage
* `README.md` changes
* Better documentation
* Added `better-curry` dependency for performance reasons and utility
* Added UMD pattern and `bower.json`
* Fix `$instanceOf`
* Changes in JSDOC
* Implement `$names` (shortcut for `Object.getOwnPropertyNames(this)`)
* Added `$inherit` for importing another class completely, but with separated arguments
* Class `$implements` must be unique
* Fix `constructor` member of class
* Removed deprecated code (`create`, `implement`, `define`, `include`)
* `$super` injection now supports async operations, but it's not backward compatible

## 1.1.3
* Fix test for new expect version
* Added coverage badge

## 1.1.1
* Declarations on prototype should be deletable by default. If you must, use Object.defineProperty inside your construct
* Implemented $destroy to ensure there are NO traces of references in the instance
* Minor performance improvements

## 1.1.0
* Getters and setter should retain their properties (enumerable, configurable, etc)
* Added $import, you can mixin to the class after it been instantiated
* Made "non dollar" functions deprecated (and they can be overriden, the $ functions can't, that is, $define, $implement, $include, $create). The reason is to avoid collisions when extending other classes that you do not own
* Implemented $exchange, you can change the current instance __proto__ to something else on-the-fly
* Named functions to be easier to spot bugs on stack

## 1.0.3
* Fix getter and setters by using getOwnPropertyDescriptor (__defineGetter__ and __defineSetter__)
* Fix crash when trying to call an object as a parent constructor
* Fix edge case where other classes were using __proto__ and it wasn't being imported to the prototype

## 1.0.2

* Fix `implement` code for arrays
* Inheritance now works with classes like Node.js `Buffer`, that has auto instantiation code, without the need of using `new` operator
* The `new` operator was missing some steps, needed to replicate `ES5Class.create` code
* More tests regarding the `new` operator, should be enough for now
* Performance went through the roof with more optimizations
* Fix `Object.create(null)` for node 0.11 bug

## 1.0.1

* `implement` can now apply node.js native instance super calls, by passing true as the second argument, automatically

## 1.0.0

* Many minor performance tweaks (that in benchmarks are important) according to jsperf benchmarks
* Version 1.0.0 got breaking API changes, because the behavior of mixins has changed (now properly applies instance and class methods separately)
* Added more tests and made some changes to existing ones
* This branch uses `__proto__`/`Object.setPrototypeOf` (when available) instead of `Object.create`, so the next change item could happen
* The class can be auto instantiated using `MyClass(instance, values)`, `MyClass.create(instance, values)` and using the `new` operator

## 0.7.2

* Fixed specific EventEmitter code for node 0.8

## 0.7.1

* Fixed code for node 0.11 and 0.8

## 0.7.0

* Fixed `implement` when importing other classes like `EventEmitter`
* Changed code to strict
* Changed the way the prototype of functions and objects are cloned

## 0.6.4

* Readme and more tests

## 0.6.3

* Fixed mixin injection when using `define`

## 0.6.2

* Added a new test and reordered `README.md`, added JsDocs in source

## 0.6.1

* Forgot to update `README.md` to the new code

## 0.6.0

* Renamed class inside file to `ES5Class` for obvious reasons
* Changed `extend` to `define` (makes more sense)
* Fixed memory leak on `Object.create`
* Change `nodeunit` to `mocha`
* Fixed `Maximum call stack size exceeded` when extending classes
* When passing a closure to the function, the argument passed is the `$parent` for `implement` and `$parent.prototype` for `include`

## 0.5.0

* Changed library to `index.js`, since not using `lib` folder or `main` in `package.json`

## 0.4.2

* Minor `README.md` modification and added `keywords`

## 0.4.1

* Moar performance increases on `$super` functionWrapper according to this [jsperf](http://jsperf.com/regex-external-vs-inline/2)

## 0.4.0

* Increased performance on `$super` calls by at least 40% and up to 476%

## 0.3.5

* Added `$super` to Class method calls