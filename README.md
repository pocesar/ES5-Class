# ES5-Class
=========

[![Build Status](https://travis-ci.org/pocesar/ES5-Class.png?branch=master)](https://travis-ci.org/pocesar/ES5-Class)

A Class object that enables native prototypal inheritance

* Inheritance made easy
* Uses Object.create ES5 method to enable native prototypal inheritance with proper settings (enumerable, configurable, writable)
* Works with Node.js 0.8.x and up.
* Instances and classes gets useful methods and properties for reflections and navigation
* Functions to implement other class methods and include other instance/prototype methods
* Takes advantage of ES5 non-writable properties to disable the possibility of messing up the classes
* Ability to inherit from multiple classes using arrays using `Class.extend('YourClass', [Class1, Class2, Class3])`
* Call `this.$super` to reach the parent instance class function 
* Call `this.$parent` to reach the parent class method 
* Inject mixin code (as plain objects, functions or other classes) using `include`
* `$implements` property contain all classes or objects that were implemented into the class
* Access the first parent using `$parent`
* The `construct` method is called with arguments when the class is instantiated

__Contributors__

* [ShadowCloud](https://github.com/ShadowCloud)
* [pocesar](https://github.com/pocesar)

## Install
-----------

```
npm install es5class
```

## Usage
-----------

### Creating a new class

```js
var Animal = Class.extend(
    // Class Name
    'Animal', 
    // Instance Methods/Properties, these will only be available through a class instance, through Animal.create('Name')
    { 
        construct: function(name) { // Constructor is called automatically on instantiation
            this.name = name;
        },
        getName: function() {
            return this.name;
        }
    },
    // Class Methods/Properties, this will only be available through Animal, as in Animal.count
    { 
        count: 0
    }
);
```

### Singletons

```js
var Singleton = Class.extend('Singleton', {}, {
    staticHelper: function(){
        return 'helper';
    },
    staticVariable: 1
});

var ExtraSingleton = Class.extend('Extra');
ExtraSingleton.implements(Singleton);
ExtraSingleton.implements({
    extra: true
});

ExtraSingleton.staticHelper() // outputs 'helper'
``` 
 
### Class inheritance

```js
var Bird = Animal.extend('Bird', {
    construct: function(name) {
        this.$super(name); // calls parent class constructor, calls Animal.construct and set this.name = name
    },
    canFly: true
});
```

### Encapsulate logic by passing a closure

```js
Bird.include(function(){
    var timesBeaked = 0;
    
    return {
        beak: function(){
            return ++timesBeaked;
        }
    };
});
```

### Share data between instances

```js
var Share = Class.extend('Share', function(){
    var _data = {};
    
    return {
        append: function(name, data){
          _data[name] = data;   
        }
    }
});
var one = Share.create('one'), two = Share.create('two');
one.append('dub', true); // _data is now {'dub': true}
two.append('dub', false); // _data is now {'dub': false}
two.append('bleh', [1,2,3]); // _data is now {'dub': false, 'bleh': [1,2,3]}
```

### Extending a prototype

```js
Bird.include({ 
    fly: function() {
        if(this.canFly) console.log(this.name + " flies!");
    },
});
```

### Extending a class

```js
// These functions and values persist between class creation, serve as static methods
Animal.implement({
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
var Dog = Animal.extend('Dog');
Animal.run(); // Cat.ran, Dog.ran and Animal.ran are 10
var Cat = Animal.extend('Cat');
Cat.run(); // Cat.ran is 20, Dog.ran and Animal.ran are 10
Dog.run(); // 
Dog.run(); // Cat.ran is 20, Dog.ran is 30 and Animal.ran is 10

// If you implement the same method, you can update the parent using this.$parent
// If you want to update the parent value, you can also use this.$parent.ran
Dog.implement({
    run: function(){
        this.ran += 10;
        this.$parent.run(); // Animal.ran is now 10
    }
});

Dog.run() // Dog.ran is now 40
```

### Creating an instance

```js
var animal = Animal.create("An Animal");
var bird = Bird.create("A Bird");
```

### Checking instances

```js
animal.$instanceOf(Animal); // true
animal.$instanceOf(Bird);   // false
bird.$instanceOf(Animal);   // true
bird.$instanceOf(Bird);     // true
bird.$instanceOf(Class);    // true
```

### Other useful methods and properties

```js
Animal.$className;                // Animal
bird.$getClass();                   // returns the Bird class definition, you can do a $getClass().create('another instance')
bird.$getClass().$className        // Bird
bird.$getClass().$parent.$className // Animal
bird.$parent.$getClass().$className // Animal
bird.$isClass(Bird); // true
Animal.$isClass(Bird); // false
```

## Running the tests
-----------

The tests are ran using [nodeunit](https://github.com/caolan/nodeunit)

```
npm install && npm test
```

## Feeback
-----------

Please use the issues section of github to report any bug you may find

## License
-----------

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