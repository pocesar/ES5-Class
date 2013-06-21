var
  testCase = require('nodeunit').testCase,
  Class = require('../es5class'),
  Animal, Bird, Dog, Beagle, Color, Privat, animal, beagle, bird, dog, color, privat, privat2;

module.exports = testCase({
  setUp: function (done){
    Animal = Class.extend(
      'Animal',
      {
        construct: function (name){
          this.name = name;
          this.increment();
        },
        getName  : function (){
          return this.name;
        },
        canFly   : false,
        increment: function (){
          var parent = this;
          while (parent && parent.$getClass && parent.$getClass().count !== null) {
            parent.$getClass().count++;
            parent = parent.$parent;
          }
        }

      },
      {
        count: 0,
        run: function (){
          for (var i = 1; i <= 10; i++) {
            this.ran++;
            console.log("It ran for " + i + " miles!");
          }
        },
        ran: 0
      }
    );

    Bird = Animal.extend(
      'Bird',
      {
        construct: function (name){
          this.$super(name);
          this.canFly = true;
        }
      },
      {
        count: 0
      }
    );

    Color = Class.extend('Color', {
      setColor: function (name){
        this.color = name;
      }
    }, {
      color: 'brown'
    });

    Dog = Animal.extend('Dog', {
      construct: function (name){
        this.name = name;
      }
    }, {
      run: function(){
        this.ran += 20;
        //this.$parent.run();
      }
    });

    Dog.include({
      cry: function (){
        return 'wof!';
      }
    });

    Dog.implement([{
      isBig: true
    }, Color]);

    Beagle = Class.extend('Beagle', {}, {});
    Beagle.implement([Dog, Color]);
    Beagle.include({
      construct: function (name){
        this.name = name;
        this.setColor('white and brown');
      }
    });
    Beagle.isBig = false;

    Privat = Class.extend('Private', function (){
      var arr = [];

      return {
        construct: function(initial){
          if (initial) {
            arr = initial;
          }
        },
        push : function (item){
          arr.push(item);
          return this;
        },
        items: function (){
          return arr;
        },
        reset: function (){
          arr = [];
          return this;
        }
      };
    });
    
    Privat.include(function(){
      var another_private = 'yes';
      
      return {
        'private': another_private,
        'privateGet': function(){
          return another_private;
        }
      };
    });
    
    Privat.implement(function(){
      var deal = -1;
      
      return {
        deal: function(){
          return ++deal;
        }
      };
    });

    animal = Animal.create('An Animal');
    bird = Bird.create('A Bird');
    dog = Dog.create('A Dog');
    beagle = Beagle.create('A Beagle');
    color = Color.create('A color');
    privat = Privat.create([1,2,3,4]);
    privat2 = Privat.create();

    done();
  },

  tearDown: function (done){
    Animal = null;
    Color = null;
    Bird = null;
    Dog = null;
    Beagle = null;
    Privat = null;
    animal = null;
    bird = null;
    dog = null;
    beagle = null;
    privat = null;
    done();
  },
  
  testDuckTyping: function(test){
    test.expect(2);
    
    var Op = Class.extend('Op', {
      construct: function (number){
        this.number = number;
      },
      operator : function (number){
        return number;
      }
    });

    var Mul = Op.extend('Multiply', {
      operator: function (number){
        return number * this.number;
      }
    });

    var Div = Op.extend('Divide', {
      operator: function (number){
        return number / this.number;
      }
    });

    var Sum = Op.extend('Sum', {
      operator: function (number){
        return number + this.number;
      }
    });

    var Operation = Class.extend('Operation', {}, function (){
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

    var sum = Sum.create(40);
    var mul = Mul.create(50);
    var div = Div.create(20);
    Operation.number(100);
    test.equals(Operation.add([sum, mul, div]).result(), 350);
    var mul2 = Mul.create(30);
    test.equals(Operation.onthefly([div, sum, mul, mul2]), 67500);
    
    test.done();
  },
  
  testClassExtend: function (test){
    test.expect(3);
    test.throws(function (){
      Class.extend();
    });
    test.ok(Class.extend('SubClass'));
    test.ok(Class.extend('SubClass', {}, {}));
    test.done();
  },

  testClasses: function (test){
    test.expect(6);
    test.ok(Animal);
    test.ok(Bird);
    test.ok(Dog);
    test.ok(Beagle);
    test.ok(Color);
    test.ok(Privat);
    test.done();
  },

  testInstances: function (test){
    test.expect(5);
    test.ok(animal);
    test.ok(bird);
    test.ok(dog);
    test.ok(beagle);
    test.ok(privat);
    test.done();
  },

  testClassProperties: function (test){
    test.expect(11);

    test.equals(Animal.count, 2);
    test.deepEqual(Animal.$implements, []);

    test.equals(Bird.count, 1);
    test.equals(Dog.isBig, true);
    test.equals(Beagle.isBig, false);
    test.equals(Beagle.color, 'brown');

    test.ok(!Beagle.count);

    test.ok(!Beagle.$implements[0].$isClass(Bird));
    test.ok(!Beagle.$implements[0].$isClass(Animal));
    test.ok(Beagle.$implements[0].$isClass(Dog));
    test.ok(Beagle.$implements[1].$isClass(Color));

    test.done();
  },

  testInstanceProperties: function (test){
    test.expect(12);

    test.equals(animal.name, 'An Animal');
    test.deepEqual(animal.$implements, []);
    test.equals(bird.name, 'A Bird');
    test.equals(animal.canFly, false);
    test.equals(bird.canFly, true);
    test.equals(bird.$parent.canFly, false);
    test.equals(dog.name, 'A Dog');
    test.equals(Dog.color, 'brown');
    test.equals(beagle.name, 'A Beagle');
    test.equals(beagle.color, 'white and brown');

    test.ok(beagle.$implements[0].$isClass(Dog));
    test.ok(beagle.$implements[1].$isClass(Color));

    test.done();
  },

  testInstanceOf: function (test){
    test.expect(2);

    test.ok(animal.$instanceOf);
    test.ok(privat.$instanceOf);

    test.done();
  },

  testIsClass: function (test){
    test.expect(4);

    test.ok(animal.$isClass(Animal));
    test.ok(!animal.$isClass(Class));
    test.ok(privat.$isClass(Privat));
    test.ok(!privat.$isClass(Class));

    test.done();
  },

  testInheritance: function (test){
    test.expect(16);

    test.ok(animal.$instanceOf(Animal));
    test.ok(animal.$instanceOf(Class));
    test.ok(!animal.$instanceOf(Bird));

    test.ok(bird.$instanceOf(Bird));
    test.ok(bird.$instanceOf(Animal));
    test.ok(bird.$instanceOf(Class));

    test.ok(dog.$instanceOf(Dog));
    test.ok(dog.$instanceOf(Class));
    test.ok(dog.$instanceOf(Animal));
    test.ok(!dog.$instanceOf(Bird));

    test.ok(beagle.$instanceOf(Beagle));
    test.ok(beagle.$instanceOf(Class));
    test.ok(!beagle.$instanceOf(Dog));
    test.ok(!beagle.$instanceOf(Animal));
    test.ok(!beagle.$instanceOf(Bird));
    test.ok(!beagle.$instanceOf(Color));

    test.done();
  },

  testInheritedMethods: function (test){
    test.expect(4);
    test.ok(bird.getName);
    test.equals(bird.getName(), 'A Bird');
    test.equals(dog.cry(), 'wof!');
    test.equals(beagle.cry(), 'wof!');
    test.done();
  },

  testClassNames: function (test){
    test.expect(11);

    test.equals(Class.$className, 'Class');
    test.equals(Animal.$className, 'Animal');
    test.equals(Dog.$className, 'Dog');
    test.equals(Beagle.$className, 'Beagle');

    test.equals(animal.$getClass().$className, 'Animal');
    test.equals(bird.$getClass().$className, 'Bird');
    test.equals(bird.$getClass().$parent.$className, 'Animal');

    test.equals(dog.$getClass().$className, 'Dog');
    test.equals(dog.$getClass().$parent.$className, 'Animal');
    test.equals(beagle.$getClass().$className, 'Beagle');
    test.equals(beagle.$getClass().$parent.$className, 'Class');

    test.done();
  },
  
  testPrivateAndDataShare: function(test){
    test.expect(10);
    
    test.equals(privat.items().length, 4);
    test.deepEqual(privat.items(), [1,2,3,4]);
    privat.push(5);
    test.deepEqual(privat.items(), [1,2,3,4,5]);
    privat.reset();
    test.deepEqual(privat.items(), []);
    privat.push(6);
    test.equals(privat.items()[0], 6);
    test.equals(privat.private, 'yes');
    test.equals(privat.privateGet(), 'yes');
    test.equals(Privat.deal(), 0);
    privat2.push(13);
    test.equals(privat2.items().length, 2);
    test.deepEqual(privat.items(), [6,13]);
      
    test.done();
  }, 
  
  testUseStrict: function(test){
    'use strict';
    test.expect(3);

    /* 
     Overriding a non-writable value would throw an error in Strict Mode
     For now it fails silently, so we're just checking that the value can't be changed
     */
    
    test.throws(function (){
      bird.$getClass().$className = 'trying to modify className';
    });

    test.throws(function (){
      Bird.prototype.$getClass = function (){};
    });

    test.throws(function (){
      Class.prototype.$instanceOf = function (){};
    });

    test.done();
  },
  
  testProtectedMethods: function (test){
    test.expect(3);
    
    var temp = bird.$getClass().$className;
    bird.$getClass().$className = 'trying to modify className';
    test.strictEqual(bird.$getClass().$className, temp);

    temp = Bird.prototype.$getClass;
    Bird.prototype.$getClass = function (){};
    test.strictEqual(Bird.prototype.$getClass, temp);

    temp = Class.prototype.$instanceOf;
    Class.prototype.$instanceOf = function (){};
    test.strictEqual(Class.prototype.$instanceOf, temp);

    test.done();
  },

  testConstructor: function (test){
    test.expect(2);
    test.notEqual(typeof Bird, 'function');
    test.ok(Bird.create);
    test.done();
  }
});