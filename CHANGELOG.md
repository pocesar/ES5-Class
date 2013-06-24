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