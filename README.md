[![Build Status](https://travis-ci.org/pocesar/ES5-Class.png?branch=master)](https://travis-ci.org/pocesar/ES5-Class)
[![Coverage Status](https://coveralls.io/repos/pocesar/ES5-Class/badge.png?branch=master)](https://coveralls.io/r/pocesar/ES5-Class?branch=master)
[![devDependency Status](https://david-dm.org/pocesar/es5-class/dev-status.svg)](https://david-dm.org/pocesar/es5-class#info=devDependencies)
[![Github Repository](http://img.shields.io/badge/github-repo-orange.svg)](https://github.com/pocesar/ES5-Class)

<!-- [![browser support](https://ci.testling.com/pocesar/ES5-Class.png)](https://ci.testling.com/pocesar/ES5-Class) -->

[![NPM](https://nodei.co/npm/es5class.png?downloads=true)](https://nodei.co/npm/es5class/)

# ES5-Class

A Class object that enables native prototypal inheritance for Node and modern browsers.

It's called class because it encapsulate your methods, provide inheritance, set static and prototype methods and variables,
and provide helper functions along all your instances.

Why should we write code like if we were in 2010? Read on!

* Multiple inheritance made easy 
* It's freaking fast, check the [benchmark section](#benchmark)
* Uses `Object.setPrototypeOf` (when available, using `__proto__` when isn't), `Object.create` and `Object.defineProperty` ES5/ES6 methods to enable native prototypal inheritance with proper settings (enumerable, configurable, writable)
* Works with Node.js 0.8.x and up, and modern browsers (IE11, Firefox, Chrome, Safari).
* Functions to implement other class methods and include other instance/prototype methods
    * The `$implement` method imports both prototype and class methods
    * The `$include` method imports prototype methods, and class methods as prototype
* Takes advantage of ES5 non-writable properties to disable the possibility of messing up the classes
* Ability to inherit from multiple classes using arrays using `Class.$define('YourClass', [Class1, Class2, Class3])` without setting the `$parent` class, working like mixins/traits
* Inject and call `$super` to reach the parent instance class functions or extended class method
* Call `this.$parent` to reach the parent class definition inside your methods
* `this.$implements` array property contain all classes that were implemented into the current class instance
* The `construct` method is called with arguments when the class is instantiated
* `this.$class` is available everywhere, it returns the current class, even before instantiation
* You are free to instantiate your class using `Class.$create(arguments)`, `Class(arguments)` and `new Class(arguments)`

## Breaking changes

Version 1.x had `this.$super` call, but it wasn't "async safe". If you would execute it in an asynchronous (`setImmediate`,
`setTimeout`, inside Promises or other callbacks), `this.$super` could be either undefined or be another function, since
`this.$super` was a global state variable on the instance.

To solve this, the `$super` (idea taken from Prototype.js) must be injected as the first parameter on your function.

Before you'd call your `$super` classes like this:

```javascript
var Base = ES5Class.$define('Base', {
    construct: function(that, those){
        this.that = that;
        this.those = those;
    }
});
var Sub = Base.$define('Sub', {
    construct: function(){
        this.$super('that','those');
    }
});

Sub.$create('those');
```

In version 2.x, you need to call it like:

```javascript
var Base = ES5Class.$define('Base', {
    construct: function(that, those){
        this.that = that;
        this.those = those;
    }
});
var Sub = Base.$define('Sub', {
    construct: function($super, those){
        $super('that', those);
    }
});

Sub.$create('those');
```

`$super` is _merely_ a shortcut for `this.$parent.prototype.fn.apply(this, arguments);` (actually a bit fancier than that).
Nothing stops you from doing that by yourself (if you don't fancy the `$super` argument)

In version 2.x you'll also need [better-curry](https://github.com/pocesar/js-bettercurry) as a dependency.

##### Contributors

* [bfil](https://github.com/bfil)
* [pocesar](https://github.com/pocesar)

## Install

```bash
$ npm install es5class
```

```bash
$ bower install es5class
```

```javascript
// In node.js
var ES5Class = require('es5class');

// or in the browser
window.ES5Class

// or with RequireJS
define(['ES5Class'], function(ES5Class){

});
```

## Documentation

See docs in [ES5Class Documentation](http://pocesar.github.io/ES5-Class)

## Example usage

#### Creating a new class

```javascript
var Animal = Class.$define(
  // Class Name
  'Animal',
  // Prototype methods/variables, these will only be available through a class instance, in this case, through Animal.$create('Name')
  {
    construct: function (name){ // this is called automatically on instantiation
      this.name = name;
    },
    getName  : function (){
      return this.name;
    }
  },
  // Class methods/variables, this will only be available through Animal, as in Animal.count or Animal.getCount()
  {
    count   : 0,
    getCount: function (){
      return this.count;
    }
  }
);
```

#### Class inheritance

```javascript
var Bird = Animal.$define('Bird', {
  construct: function ($super, name, canFly){
    if (canFly) {
      this.canFly = canFly;
    }
    $super(name + ' Bird'); // calls parent class constructor, calls Animal.prototype.construct and set this.name = 'Yellow ' + name
  },
  canFly   : false
});
```

#### Extending a prototype

```javascript
Bird.$include({ // include is like doing _.extend(Bird.prototype, {}) but with proper wrapping the methods for $super access
  fly: function (){
    if (this.canFly) {
      console.log(this.name + ' flies!');
    } else {
      console.log(this.name + ' cant fly');
    }
  }
});
```

#### Implement

```javascript
// "Implement" import prototype (if any) and class methods from the given object, to the class declaration and the prototype
var
    Class1 = Class.$define('Class1'),
    obj = {yup: true},
    h = function(){};

h.prototype.nope = false;

Class1.$implement([obj, h]);

console.log(Class1.yup); // true (imported to the class declaration)
console.log(Class1.$create().nope); // false (imported to the prototype)
```

You can all the inheriting class construct by passing the second parameter, for example:

```javascript
var EventEmitter = require('events').EventEmitter;

// this code is the same as
Class.$define('MyEventEmitter', function(){
    this.$implement(EventEmitter);

    return {
        construct: function(){
            EventEmitter.call(this);
        }
    };
});

// this one (much cleaner)
Class.$define('MyEventEmitter').$implement(EventEmitter, true);

// There's no need for the construct + implement if you are just creating an inheritance from another Node.js class
// So it's easier to set the second parameter of implement to true, it will call the parent class constructor
// automatically
```

Because it's really easy to forget to initialize the inheriting class

#### Include

```javascript
// "Implement" import class methods *ONLY* from the given object, to the class declaration prototype *ONLY*
var
    Class1 = Class.$define('Class1'),
    obj = {yup: true},
    h = function(){};

h.prototype.nope = false;
h.yep = false;

Class1.$include([obj, h]);

console.log(Class1.$create().yup); // true (imported to the prototype)
console.log(Class1.nope); // undefined (not imported since it's in the prototype of the "h" object)
console.log(Class1.$create().nope); // undefined (not imported since it's in the prototype of the "h" object)
console.log(Class1.$create().yep); // false (imported to the prototype since it's in the declaration of the "h" object)
```

#### Inherit from any existing Node.js class

```javascript
var MyEventClass = Class.$define('MyEventEmitter', function(){
  var base = this;
  base.$implement(require('events').EventEmitter); // inherit from EventEmitter

  return {
      construct: function(){
          var self = this;
          process.nextTick(function(){
              self.emit('created', base); // we can use it in construct already!
          });
      }
  };
});

MyEventClass.$create().on('created', function(base){
    expect(base).to.eql(MyEventClass);
    expect(base.prototype.on).to.be.a('function');
});
```

#### Encapsulate logic by passing a closure

```javascript
Bird.$include(function (_super){ // _super is the Animal prototype (the parent), it contains only "construct" and "getName" per definitions above
  // "super" is a javascript reserved word, that's why it's being called _super here
  var timesBeaked = 0;
  // "this" refers to the current Class definition, that is, Bird, so you can access
  // static variables plus the prototype, before it's [re]defined
  //
  // this.prototype.getName();
  // this.count
  //
  // you may want to set var self = this; for usage inside the functions
  return {
    beak: function (){
      return ++timesBeaked;
    }
  };
});

Bird.$implement(function (_super){ // _super is the Animal class itself (the parent)
  // "this" refers to the current Class definition, the same way it happens
  // when extending the prototype (using $include), you may access this.prototype in
  // here as well
  var catalog = {};
  return {
    catalog: function (bird){ // Bird.catalog() is now available
      if (arguments.length) {
        for(var i = 0; i < arguments.length; i++) {
          catalog[arguments[i].name] = arguments[i];
        }
      }
      return catalog;
    }
  };
});
```

#### Extending a class

```javascript
// These functions and values persist between class creation, serve as static methods
Animal.$implement({
    run: function() {
        for(var i=1; i<=10; i++) {
            this.ran++; // this refer to the current class definition (either Dog, Animal or Cat)
            // you may change it to Animal.ran to make the same value available to all classes
            // also, you may use the this.$parent.ran to set it always on the Animal class when
            // calling on extended classes (Dog and Cat)
            console.log("Animal ran for " + i + " miles!");
        }
    },
    ran: 0
});

var Dog = Animal.$define('Dog');
Animal.run(); // Dog.ran and Animal.ran are 10
var Cat = Animal.$define('Cat');
Cat.run(); // Cat.ran is 20, Dog.ran and Animal.ran are 10
Dog.run(); //
Dog.run(); // Cat.ran is 20, Dog.ran is 30 and Animal.ran is 10

// If you implement the same method, you can update the parent using this.$parent
// If you want to update the parent value, you can also use this.$parent.ran
Dog.$implement({
    run: function(){
        this.ran += 10;
        this.$parent.run(); // Animal.ran is now 20
    }
});

Dog.run(); // Dog.ran is now 40, Animal.ran and Cat.ran are now 20
```

#### Creating an instance

```javascript
var animal = Animal.$create("An Animal");
var bird = Bird.$create("A Bird");
var bird2 = Bird("Another bird");
var bird3 = new Bird("Also a bird");
```

#### Checking instances

```javascript
animal.$instanceOf(Animal); // true
animal.$instanceOf(Bird);   // false
bird.$instanceOf(Animal);   // true
bird.$instanceOf(Bird);     // true
bird.$instanceOf(Class);    // true
```

#### Other useful methods and properties

```javascript
Animal.$className;                // 'Animal'
bird.$class;                      // returns the Bird class definition, you can do a $class.$create('instance', 'params')
bird.$class.$className            // 'Bird'
bird.$class.$parent.$className    // 'Animal'
bird.$parent.$className           // 'Animal'
bird.$parent.$parent.$className   // 'ES5Class'
bird.$isClass(Bird);              // true
Animal.$isClass(Bird);            // false
```

#### Mixin from other classes

```javascript
var Class1 = Class.$define('Class1', {}, {done: true}),
    Class2 = Class.$define('Class2', {func: function(){ return true; }}),
    Class3 = Class.$define('Class3', {}, {yet: true});

// This mix in the whole class (prototype and class methods)
var NewClass = Class.$define('NewClass', {}, [Class1, Class2, Class3]);

// Pay attention that it needs to go in the second parameter if you want
// to copy the object properties AND the prototype properties

// or using NewClass.$implement([Class1, Class2, Class3]);

Class1.done = false; // Changing the base classes doesn't change the mixin'd class

console.log(NewClass.done); // true
console.log(NewClass.yet); // true
console.log(NewClass.$parent); // ES5Class
console.log(NewClass.$implements); // [Class1,Class2,Class3]
console.log(NewClass.$create().func()); // true
console.log(NewClass.$create().$class.done); // true

// This mix in class methods as prototypes
NewClass = Class.$define('NewClass', [Class1, Class2, Class3]);

console.log(NewClass.$create().yet); // true
console.log(NewClass.$create().done); // false
console.log(NewClass.$create().func); // undefined
```

#### Singletons

```javascript
var Singleton = Class.$define('Singleton', {}, {
    staticHelper: function(){
        return 'helper';
    },
    staticVariable: 1
});

var ExtraSingleton = Class.$define('Extra');
ExtraSingleton.$implement(Singleton);
ExtraSingleton.$implement({
    extra: true
});

ExtraSingleton.staticHelper() // outputs 'helper'
Singleton.extra // undefined
ExtraSingleton.extra // true
ExtraSingleton.staticVariable // 1
```

#### Share data between instances (flyweight pattern)

```javascript
var Share = Class.$define('Share', function(){
    var _data = {}; //all private data, that is shared between each Share.$create()

    return {
        construct: function(){
            this.$class.count++;
        },
        append: function(name, data){
          _data[name] = data;
        }
    }
}, {
    count: 0 // exposed variable
});
var one = Share.$create('one'), two = Share.$create('two'); // Share.count is now 2
one.append('dub', true); // _data is now {'dub': true}
two.append('dub', false); // _data is now {'dub': false}
two.append('bleh', [1,2,3]); // _data is now {'dub': false, 'bleh': [1,2,3]}
```

#### Duck typing (nothing stops you to not using inheritance and decoupling classes)

```javascript
var Op = Class.$define('Op', {
    construct: function (number){
      this.number = number;
    },
    operator : function (number){
      return number;
    }
  });

  var Mul = Op.$define('Multiply', {
    operator: function (number){
      return number * this.number;
    }
  });

  var Div = Op.$define('Divide', {
    operator: function (number){
      return number / this.number;
    }
  });

  var Sum = Op.$define('Sum', {
    operator: function (number){
      return number + this.number;
    }
  });

  var Operation = Class.$define('Operation', {}, function (){
    var
      classes = [],
      number = 0;

    return {
      add     : function (clss){
        for (var i = 0, len = clss.length; i < len; i++) {
          classes.push(clss[i]);
        }
        return this;
      },
      number  : function (nmbr){
        number = nmbr;
        return this;
      },
      result  : function (){
        var result = number;
        for (var i = 0, len = classes.length; i < len; i++) {
          result = classes[i].operator(result);
        }
        return result;
      },
      onthefly: function (classes){
        var result = number;
        for (var i = 0, len = classes.length; i < len; i++) {
          result = classes[i].operator(result);
        }
        return result;
      }
    };
  });

  var sum = Sum.$create(40);
  var mul = Mul.$create(50);
  var div = Div.$create(20);
  Operation.number(100);
  Operation.add([sum, mul, div]).result(); // Result is 350
  var mul2 = Mul.$create(30);
  Operation.onthefly([div, sum, mul, mul2]); // Result is 67500
```

For a lot of class examples (inheritance, extending, singletons, etc), check the test sources at `test/class-test.js`

## Performance tip

Although the class helpers, `$super` calls, class inheritance itself are fast, `$define`'ing your class isn't.

For some odd reason, `Object.defineProperties` and `Object.defineProperty` is long known to have the worst performance in V8
(and other engines as well).

Basically, you should never keep redefining your class, for example, in loops, inside other constructors, etc.
The `ES5Class.$define` is a real bottleneck (as low as 10k ops/s). So, `$define` it once, create instances everywhere!

## Running the tests

The tests are ran using [mocha](https://github.com/visionmedia/mocha)

```bash
$ npm install && npm run test
```

## Benchmark

Check how this library perform on your machine

```bash
$ npm install && npm run benchmark
```

A benchmark result in a 1st gen Core i3:

```
class instance function call x 114,660,575 ops/sec ±7.30% (32 runs sampled)
class method function call x 118,824,558 ops/sec ±4.74% (57 runs sampled)
class instance included function call x 98,900,288 ops/sec ±3.71% (56 runs sampled)
$super instance function calls x 14,078,465 ops/sec ±0.55% (97 runs sampled)
$super class function calls x 13,880,657 ops/sec ±0.43% (99 runs sampled)
$super inherited two levels deep function calls x 4,664,890 ops/sec ±0.51% (96 runs sampled)
class.$create instantiation x 1,617,001 ops/sec ±1.60% (90 runs sampled)
new operator x 2,493,494 ops/sec ±0.32% (101 runs sampled)
obj() instance x 1,076,858 ops/sec ±0.88% (91 runs sampled)
Class definition x 12,307 ops/sec ±2.76% (83 runs sampled)
```

<!--- old performance data, kept for historic reasons
```
class instance function call x 1,598,593 ops/sec ±1.33% (92 runs sampled)
class method function call x 113,626,665 ops/sec ±4.11% (63 runs sampled)
class instance included function call x 1,612,332 ops/sec ±1.48% (92 runs sampled)
$super instance function calls x 543,054 ops/sec ±3.79% (81 runs sampled)
$super class function calls x 11,954,826 ops/sec ±0.64% (97 runs sampled)
$super inherited two levels deep function calls x 5,852,093 ops/sec ±0.30% (95 runs sampled)
class instantiation x 1,257,516 ops/sec ±1.11% (93 runs sampled)
new instantiation x 2,992,584 ops/sec ±0.53% (96 runs sampled)
Auto instantiation x 1,276,445 ops/sec ±1.11% (93 runs sampled)
```
-->

## Feeback

Please use the issues section of github to report any bug you may find

## License

(The MIT License)

Copyright (c) 2011 Bruno Filippone

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.