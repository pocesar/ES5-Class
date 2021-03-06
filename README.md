[![Build Status](https://travis-ci.org/pocesar/ES5-Class.png?branch=master)](https://travis-ci.org/pocesar/ES5-Class)
[![Coverage Status](https://coveralls.io/repos/pocesar/ES5-Class/badge.png?branch=master)](https://coveralls.io/r/pocesar/ES5-Class?branch=master)
[![devDependency Status](https://david-dm.org/pocesar/es5-class/dev-status.svg)](https://david-dm.org/pocesar/es5-class#info=devDependencies)
[![Github Repository](http://img.shields.io/badge/github-repo-orange.svg)](https://github.com/pocesar/ES5-Class)
[![Check Documentation](http://img.shields.io/badge/check-documentation-blue.svg)](http://pocesar.github.io/ES5-Class)
![API Stability: Stable](http://img.shields.io/badge/api-stable-brightgreen.svg)

<!-- [![browser support](https://ci.testling.com/pocesar/ES5-Class.png)](https://ci.testling.com/pocesar/ES5-Class) -->

[![NPM](https://nodei.co/npm/es5class.png?downloads=true)](https://nodei.co/npm/es5class/)

# ES5-Class

## Highlights 

A Class object that enables native prototypal inheritance for Node and modern browsers.

It's called class because it encapsulate your methods, provide inheritance, set static and prototype methods and variables,
and provide helper functions along all your instances.

Why should we write code like if we were in 2010? Read on!

* Multiple inheritance made easy 
* Support `get`, `set`, `__defineGetter__`, `__defineSetter__` without any extra code
* It's freaking fast, check the [benchmark section](#benchmark)
* Uses `Object.setPrototypeOf` (when available, using `__proto__` when isn't), `Object.create` and `Object.defineProperty` ES5/ES6 methods to enable native prototypal inheritance with proper settings (enumerable, configurable, writable)
* Works with Node.js 0.8.x and up (including node-webkit), and really modern browsers (IE11, Firefox, Chrome, Safari).
* Functions to implement other class methods and include other instance/prototype methods
    * The `$implement` method imports both prototype and class methods
    * The `$include` method imports prototype methods, and class methods as prototype
* Takes advantage of ES5 non-writable properties to disable the possibility of messing up the classes
* Ability to inherit from multiple classes using arrays using `ES5Class.$define('YourClass', [Class1, Class2, Class3])` without setting the `$parent` class, working like mixins/traits
* Inject and call `$super` to reach the parent instance class functions or extended class method
* Call `this.$parent` to reach the parent class definition inside your methods
* `this.$implements` array property contain all classes that were implemented into the current class instance
* The `construct` method is called with arguments when the class is instantiated
* `this.$class` is available everywhere, it returns the current class, even before instantiation
* You are free to instantiate your class using `Class.$create(arguments)`, `Class(arguments)` and `new Class(arguments)`

## Documentation

See docs in [ES5Class Documentation](http://pocesar.github.io/ES5-Class)

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
    construct: function(those){
        this.$super('that', those);
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
Nothing stops you from doing that by yourself (if you don't fancy the `$super` argument injection)

In version 2.x you'll also need [better-curry](https://github.com/pocesar/js-bettercurry) as a dependency.

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

## Example usage

#### Creating a new class

```javascript
var Animal = ES5Class.$define(
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
    // calls parent class constructor, calls Animal.prototype.construct 
    // and set this.name
    if (canFly) {
      this.canFly = canFly;
    }
    $super(name + ' Bird'); 
  },
  // Bird.prototype.canFly
  canFly   : false 
});
```

#### Extending the prototype

```javascript
// append functions to the prototype. existing functions in the prototype are 
// wrapped for $super access
Bird.$include({ 
  // Bird.prototype.fly
  fly: function (){
    if (this.canFly) {
      console.log(this.name + ' flies!');
    } else {
      console.log(this.name + ' cant fly');
    }
  }
});
```

#### Add static and prototype members to the class

```javascript
// "Implement" import the prototype (if it has a prototype) and class methods from the 
// given object, to the class declaration
var
    Class1 = ES5Class.$define('Class1'),
    obj = {yup: true},
    h = function(){};

h.prototype.nope = false;

Class1.$implement([obj, h]);

console.log(Class1.yup); // true (imported to the class declaration)
console.log(Class1.$create().nope); // false (imported to the prototype)
```

You can call the inheriting class `$super` construct by passing true to the second parameter, 
for example:

```javascript
var EventEmitter = require('events').EventEmitter;

// this code is the same as
ES5Class.$define('MyEventEmitter', function(){
    this.$implement(EventEmitter);

    return {
        construct: function(){
            EventEmitter.call(this);
        }
    };
});

// this one (much cleaner)
ES5Class.$define('MyEventEmitter').$implement(EventEmitter, true);

// There's no need for the construct + implement if you are just creating 
// an inheritance from another Node.js class
// So it's easier to set the second parameter of implement to true, it 
// will call the parent class constructor automatically
```

Because it's really easy to forget to initialize the super constructor of the inheriting class

#### Include (mixin) to the current prototype

```javascript
// "Implement" import class methods *ONLY* from the given object, 
// to the class declaration prototype *ONLY*
var
    Class1 = ES5Class.$define('Class1'),
    obj = {yup: true},
    h = function(){};

h.prototype.nope = false;
h.yep = false;

Class1.$include([obj, h]);

// true (imported to the prototype)
console.log(Class1.$create().yup); 
// undefined (not imported since it's in the prototype of the "h" object)
console.log(Class1.nope); 
// undefined (not imported since it's in the prototype of the "h" object)
console.log(Class1.$create().nope); 
// false (imported to the prototype since it's in the declaration of the "h" object)
console.log(Class1.$create().yep); 
```

#### Inherit from any existing (Node.js) class

```javascript
var MyEventClass = ES5Class.$define('MyEventEmitter', function(){
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

// or

MyEventClass.$inherit(require('events').EventEmitter, []);
```

#### Constants

```javascript
var
  MyClass = ES5Class.$define('MyClass').$const({
    cant: 'touch this'
  });
  MyClass.cant = false; 
  // still 'touch this'
  // throws exception on strict mode
```

#### Encapsulate logic by passing a closure

```javascript
Bird.$include(function (_super){ 
  // _super is the Animal prototype (the parent), it contains only 
  // "construct" and "getName" per definitions above
  
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

Bird.$implement(function (_super){ 
  // _super is the Animal class itself (the parent)
  
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

#### Exchange the instance prototype chain 

```javascript
var MyEmptyClass = ESClass.$define('MyEmptyClass');
MyEmptyClass.$create().$exchange(Error); // MyEmptyClass instance now 'looks like' an Error instance  
```

#### Import an object to the current instance

```javascript
var MyEmptyClass = ESClass.$define('MyEmptyClass');
var instance = MyEmptyClass.$create().$import({
    somenew: function(){
    }
});
instance.somenew();
```

#### Enumerate members

```javascript
ES5Class.$define('MyClass',{
    some:'member',
    somefn:function(){}
}).$create().$names;
 
// ['some','somefn']
```

#### Wrap an existing object or function as an ES5Class

```javascript
var someRandomObject = {};
var MyClass = ES5Class.$wrap(someRandomObject, 'MyClass'); // creates a new class 
ES5Class.$wrap(MyClass); // returns itself
```

#### Prototypal inheritance from another class

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

// primitives are copied over to new classes (in this case, Cat and Dog)
// objects retain their reference between all classes
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

#### Mixin from other classes (Object composition)

```javascript
var Class1 = ES5Class.$define('Class1', {}, {done: true}),
    Class2 = ES5Class.$define('Class2', {func: function(){ return true; }}),
    Class3 = ES5Class.$define('Class3', {}, {yet: true});

// This mix in the whole class (prototype and class methods)
var NewClass = ES5Class.$define('NewClass', {}, [Class1, Class2, Class3]);

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
NewClass = ES5Class.$define('NewClass', [Class1, Class2, Class3]);

console.log(NewClass.$create().yet); // true
console.log(NewClass.$create().done); // false
console.log(NewClass.$create().func); // undefined
```

#### Singletons

```javascript
var Singleton = ES5Class.$define('Singleton', {}, {
    staticHelper: function(){
        return 'helper';
    },
    staticVariable: 1
});

var ExtraSingleton = ES5Class.$define('Extra');
ExtraSingleton.$implement(Singleton);
ExtraSingleton.$implement({
    extra: true,
    staticHelper: function($super){
      return 'Extra' + $super();
    }
});

Singleton.extra // undefined
ExtraSingleton.extra // true
ExtraSingleton.staticVariable // 1
ExtraSingleton.staticHelper(); // 'Extrahelper'
```

#### Share data between instances (flyweight pattern)

```javascript
var Share = ES5Class.$define('Share', function(){
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
var Op = ES5Class.$define('Op', {
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

  var Operation = ES5Class.$define('Operation', {}, function (){
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
class instance function call x 125,269,746 ops/sec ±10.00% (34 runs sampled)
class method function call x 123,280,719 ops/sec ±4.17% (40 runs sampled)
class instance included function call x 103,738,852 ops/sec ±3.78% (42 runs sampled)
$super instance function calls x 14,187,910 ops/sec ±0.44% (96 runs sampled)
$super class function calls x 13,874,190 ops/sec ±0.73% (96 runs sampled)
$super inherited two levels deep function calls x 6,910,075 ops/sec ±0.40% (100 runs sampled)
class.$create instantiation x 1,832,552 ops/sec ±1.69% (91 runs sampled)
new operator x 4,544,620 ops/sec ±0.37% (98 runs sampled)
obj() instance x 1,225,367 ops/sec ±2.45% (96 runs sampled)
ES5Class.$define x 12,106 ops/sec ±2.73% (85 runs sampled)
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

##### Contributors

* [bfil](https://github.com/bfil)
* [pocesar](https://github.com/pocesar)

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