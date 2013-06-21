# ES5-Class
=========

A Class object that enables native prototypal inheritance

* Inheritance made easy
* Uses Object.create ES5 method to enable native prototypal inheritance
* Works with Node.js and in the browsers that supports ES5 Object and Properties.
* Instances and classes gets useful methods and properties for reflections and navigation
* Functions to implement other class methods and include other instance/prototype methods
* Takes advantage of ES5 non-writable properties to disable the possibility of messing up the classes
* Ability to inherit from multiple classes
* Can call the the $super method
* Can create singletons that can be extended, and call $super as well

__Contributors__

* [ShadowCloud](https://github.com/ShadowCloud)
* [pocesar](https://github.com/pocesar)

## Install
=========

```
npm install es5class
```

## Usage
=========

### Creating a new class

```js
var Animal = Class.extend(
    'Animal', // Class Name
    { // Instance Methods/Properties
        init: function(name) { // Constructor
            this.name = name;
        },
        getName: function() {
            return this.name;
        }
    },
    { // Class Methods/Properties
        count: 0
    }
);
```

### Class inheritance

```js
var Bird = Animal.extend(
    'Bird ',
    {
        init: function(name) {
            this.$super(name); // calls parent class constructor
        },
        canFly: true
    },
    {}
);
```

### Extending a prototype

```js
Bird.include(
    {
        fly: function() {
            if(this.canFly) console.log(this.name + " flies!");
        },
    }
);
```

### Extending a class

```js
Animal.implement(
    {
        run: function() {
            for(var i=1; i<=10; i++)
                console.log(this.name + " run for " + i + " miles!");
        },
    }
);
```

### Creating an instance

```js
var animal = Animal.create("An Animal");
var bird = Bird.create("A Bird");
```

### Checking instances

```js
animal.instanceOf(Animal); // true
animal.instanceOf(Bird);   // false
bird.instanceOf(Animal);   // true
bird.instanceOf(Bird);     // true
bird.instanceOf(Class);    // true
```

### Other useful methods and properties

```js
Animal.className;                // Animal
bird.getClass().className        // Bird
bird.getClass().parent.className // Animal
bird.parent.getClass().className // Animal
```

## Running the tests
=========

The tests are ran using [nodeunit](https://github.com/caolan/nodeunit)

```
npm install && npm test
```

## Feeback
=========

Please use the issues section of github to report any bug you may find

## License
=========

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