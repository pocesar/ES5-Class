var
  expect = require('expect.js'),
  Class = require('../'),
  Animal, Bird, Dog, Beagle, Color, Privat, animal, beagle, bird, dog, color, privat, privat2;

module.exports = {
  beforeEach: function (){
    Animal = Class.define(
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
          while (parent && parent.$class && parent.$class.count >= 0) {
            parent.$class.count++;
            parent = parent.$parent;
          }
        }

      },
      {
        count: 0,
        run  : function (){
          for (var i = 1; i <= 10; i++) {
            this.ran++;
          }
        },
        ran  : 0
      }
    );

    Bird = Animal.define(
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

    Color = Class.define('Color', {
      setColor: function (name){
        this.color = name;
      }
    }, {
      color: 'brown'
    });

    Dog = Animal.define('Dog', {
      construct: function (name){
        this.name = name;
      }
    }, {
      run: function (){
        this.ran += 20;
      }
    });

    Dog.include({
      cry: function (){
        return 'wof!';
      }
    });

    Dog.implement([
      {
        isBig: true
      },
      Color
    ]);

    Beagle = Animal.define('Beagle');
    Beagle.implement([Dog, Color]);
    Beagle.include({
      construct: function (name){
        this.name = name;
        this.setColor('white and brown');
      }
    });
    Beagle.isBig = false;

    Privat = Class.define('Private', function (){
      var arr = [];

      return {
        construct: function (initial){
          if (initial) {
            arr = initial;
          }
        },
        push     : function (item){
          arr.push(item);
          return this;
        },
        items    : function (){
          return arr;
        },
        reset    : function (){
          arr = [];
          return this;
        }
      };
    });

    Privat.include(function (){
      var another_private = 'yes';

      return {
        'private'   : another_private,
        'privateGet': function (){
          return another_private;
        }
      };
    });

    Privat.implement(function (){
      var deal = -1;

      return {
        deal: function (){
          return ++deal;
        }
      };
    });

    animal = Animal.create('An Animal');
    bird = Bird.create('A Bird');
    dog = Dog.create('A Dog');
    beagle = Beagle.create('A Beagle');
    
    color = Color.create();
    color.setColor('A color');
    
    privat = Privat.create([1, 2, 3, 4]);
    privat2 = Privat.create();
  },

  after: function (){
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
  },

  ES5Class: {
    testClassAccesses: function(){
      var h = Class.define('Class', function(){
        return {
          done: function(){
            expect(this.$class.property).to.equal(true);
            expect(this.property).to.be.an('undefined');
            expect(this.dupe).to.be.an('undefined');
            expect(this.$class.dupe()).to.equal('dupe');
            
            this.$class.property = false;
          }
        }; 
      }, {
        property: true,
        dupe: function(){
          expect(this.property).to.equal(true);
          return 'dupe';
        }
      });
      
      expect(h).to.eql(h.$class);
      
      h.create().done();
      expect(h.property).to.equal(false);
      
      h.property = true;
      expect(h.dupe()).to.equal('dupe');
      expect(h.property).to.equal(true);
      expect(h.$className).to.equal('Class');
    },
    testDuckTyping: function (){

      var Op = Class.define('Op', {
        construct: function (number){
          this.number = number;
        },
        operator : function (number){
          return number;
        }
      });

      var Mul = Op.define('Multiply', {
        operator: function (number){
          return number * this.number;
        }
      });

      var Div = Op.define('Divide', {
        operator: function (number){
          return number / this.number;
        }
      });

      var Sum = Op.define('Sum', {
        operator: function (number){
          return number + this.number;
        }
      });

      var Operation = Class.define('Operation', {}, function (){
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
      expect(Operation.add([sum, mul, div]).result()).to.equal(350);
      var mul2 = Mul.create(30);
      expect(Operation.onthefly([div, sum, mul, mul2])).to.equal(67500);
    },

    testSingleton: function (){

      var Test = Class.define('Test', {}, {
        test: function (){
          return 'Test::test';
        }
      });

      expect(Test.test()).to.equal('Test::test');

      Test.implement({
        test: function (){
          return 'New::' + this.$super();
        }
      });

      expect(Test.test()).to.equal('New::Test::test');

      Test.implement({
        test: function (){
          return 'And::' + this.$super();
        }
      });

      expect(Test.test()).to.equal('And::New::Test::test');

      var NewTest = Test.define('NewTest');

      expect(NewTest.test()).to.equal('And::New::Test::test');

      NewTest.implement({
        test: function (){
          return 'NewTest::' + this.$super();
        }
      });

      expect(Test.test()).to.equal('And::New::Test::test');
      expect(NewTest.test()).to.equal('NewTest::And::New::Test::test');

    },

    testOverload: function (){

      var ES5Person = Class.define('ES5Person', {
        construct : function (name){
          this.name = name;
        },
        setAddress: function (country, city, street){
          this.country = country;
          this.city = city;
          this.street = street;
        }
      });

      var ES5FrenchGuy = ES5Person.define('ES5FrenchGuy', {
        setAddress: function (city, street){
          this.$super('France', city, street);
        }
      });

      var ES5ParisLover = ES5FrenchGuy.define('ES5ParisLover', {
        setAddress: function (street){
          this.$super('Paris', street);
        }
      });

      var p40 = ES5ParisLover.create('Mary');

      expect(p40.setAddress).to.be.a('function');
      
      p40.setAddress('CH');

      expect(p40.name).to.be('Mary');
      expect(p40.street).to.be('CH');
      expect(p40.city).to.be('Paris');
      expect(p40.country).to.be('France');

    },

    testClassExtend: function (){
      expect(function (){
        Class.define();
      }).to.throwException();
      
      expect(Class.define('SubClass')).to.be.ok();
      expect(Class.define('SubClass', {}, {})).to.be.ok();
    },

    testClasses: function (){
      expect(Animal).to.be.ok();
      expect(Bird).to.be.ok();
      expect(Dog).to.be.ok();
      expect(Beagle).to.be.ok();
      expect(Color).to.be.ok();
      expect(Privat).to.be.ok();
    },

    testInstances: function (){
      expect(animal).to.be.ok();
      expect(bird).to.be.ok();
      expect(dog).to.be.ok();
      expect(beagle).to.be.ok();
      expect(privat).to.be.ok();
    },

    testClassProperties: function (){

      expect(Animal.count).to.equal(2);
      expect(Animal.$implements).to.eql([]);

      expect(Bird.count).to.equal(1);
      expect(Dog.isBig).to.equal(true);
      expect(Beagle.isBig).to.equal(false);
      expect(Beagle.color).to.equal('brown');

      expect(Beagle.count).to.be.ok();

      expect(Beagle.$implements[0].$isClass(Bird)).not.to.be.ok();
      expect(Beagle.$implements[0].$isClass(Animal)).not.to.be.ok();
      expect(Beagle.$implements[0].$isClass(Dog)).to.be.ok();
      expect(Beagle.$implements[1].$isClass(Color)).to.be.ok();

    },

    testInstanceProperties: function (){

      expect(animal.name).to.equal('An Animal');
      expect(animal.$implements).to.eql([]);
      
      expect(bird.name).to.equal('A Bird');
      expect(animal.canFly).to.equal(false);
      expect(bird.canFly).to.equal(true);
      expect(bird.$parent.canFly).to.equal(false);
      expect(dog.name).to.equal('A Dog');
      expect(Dog.color).to.equal('brown');
      expect(beagle.name).to.equal('A Beagle');
      expect(color.color).to.equal('A color');
      expect(beagle.color).to.equal('white and brown');

      expect(beagle.$implements[0].$isClass(Dog)).to.be.ok();
      expect(beagle.$implements[1].$isClass(Color)).to.be.ok();

    },

    testInstanceOf: function (){

      expect(animal.$instanceOf).to.be.ok();
      expect(privat.$instanceOf).to.be.ok();

    },

    testIsClass: function (){

      expect(animal.$isClass(Animal)).to.be.ok();
      expect(animal.$isClass(Class)).not.to.be.ok();
      expect(privat.$isClass(Privat)).to.be.ok();
      expect(privat.$isClass(Class)).not.to.be.ok();

    },

    testInheritance: function (){

      expect(animal.$instanceOf(Animal)).to.be.ok();
      expect(animal.$instanceOf(Class)).to.be.ok();
      expect(animal.$instanceOf(Bird)).not.to.be.ok();

      expect(bird.$instanceOf(Bird)).to.be.ok();
      expect(bird.$instanceOf(Animal)).to.be.ok();
      expect(bird.$instanceOf(Class)).to.be.ok();

      expect(dog.$instanceOf(Dog)).to.be.ok();
      expect(dog.$instanceOf(Class)).to.be.ok();
      expect(dog.$instanceOf(Animal)).to.be.ok();
      expect(dog.$instanceOf(Bird)).not.to.be.ok();

      expect(beagle.$instanceOf(Beagle)).to.be.ok();
      expect(beagle.$instanceOf(Class)).to.be.ok();
      expect(beagle.$instanceOf(Dog)).not.to.be.ok();
      expect(beagle.$instanceOf(Animal)).to.be.ok();
      expect(beagle.$instanceOf(Bird)).not.to.be.ok();
      expect(beagle.$instanceOf(Color)).not.to.be.ok();

    },

    testInheritedMethods: function (){
      expect(bird.getName).to.be.ok();
      expect(bird.getName()).to.equal('A Bird');
      expect(dog.cry()).to.equal('wof!');
      expect(beagle.cry()).to.equal('wof!');
    },
    
    testExtendingBase: function(){
      var Base = Class.define('Base', {
        done: function(){
          this.$class.count++;
        }
      }, {
        count: 1
      });
      
      var Next = Base.define('Next', {
        
      }, {
        count: 0
      });
      
      expect(Base.count).to.equal(1);
      expect(Next.count).to.equal(0);
      
      var base = Base.create();
      var next = Next.create();
      
      base.done();
      next.done();
      
      expect(Base.count).to.equal(2);
      expect(Next.count).to.equal(1);
      
      Base.include({
        included: function(){
          this.$class.count++;
          return true;
        }
      });
      
      Base.implement({
        implemented: function(){
          this.count++;
          return true;
        },
        parented: function(){
          if (this.$parent.count) {
            this.$parent.count++;
          }
        }
      });
      
      expect(next.included()).to.equal(true);
      expect(Next.count).to.equal(2);
      expect(Next.implemented()).to.equal(true);
      expect(Next.count).to.equal(3);
      expect(Base.implemented()).to.equal(true);
      expect(Base.count).to.equal(3);
      expect(Next.count).to.equal(3);
      Base.parented();
      expect(Base.count).to.equal(3);
      Next.parented();
      
      Next.implement({
        implemented: function(item){
          return typeof item !== 'undefined' ? item : void 0;
        },
        another: function(){
          return this.$parent.implemented();
        },
        other: function(){
          return this.implemented(false);
        }
      });
      
      expect(Next.count).to.equal(3);
      expect(Base.count).to.equal(4);
      expect(Next.implemented()).to.be.an('undefined');
      expect(Next.another()).to.equal(true);
      expect(Next.other()).to.equal(false);
    },
    
    testClosureParentMethod: function(){
      var Clss = Class.define('Clss', {}, function(){
        return {
          factory: function(oval){
            this.oval = oval;
            return this;
          }
        };
      });
      
      var Clsss = Clss.define('Clsss', {}, function($super){
        expect(this.factory).to.be.ok();
        expect(this.factory).to.eql($super.factory);
        
        return {
          factory: function(oval){
            expect($super).to.eql(Clss);
            $super.factory.call(this, oval);
            return this;
          }
        };
      });
      
      expect(Clsss.factory(true).oval).to.be(true);
      
      var Cls = Clsss.define('Cls', {}, {
        factory: function(){
          this.$super(false);
          return this;
        }
      });
      
      expect(Cls.factory().oval).to.equal(false);
    },
    
    testClosureParentInstance: function(){
      
      var Clss = Class.define('Clss', function(){
        return {
          construct: function(oval){
            this.oval = oval;
          }
        };
      });
      
      var Clsss = Clss.define('Clsss', function($super){
        expect(this.prototype.construct).to.be.ok();
        expect(this.prototype.construct).to.eql($super.construct);
        
        return {
          construct: function(oval){
            expect($super).to.eql(Clss.prototype);
            $super.construct.call(this, oval);
          }
        };
      });
      
      expect(Clsss.create(true).oval).to.be(true);
    },
    
    testClosures: function(){
      var Count = Class.define('Count', {}, {
        count: 0
      });
      
      var Share = Count.define('Share', function (){
        var _data = {}, self = this;
        
        return {
          construct: function(){
            this.$class.count++;
          },
          append: function (name, data){
            _data[name] = data;
          },
          data: function(){
            return _data;
          },
          getCount: function(){
            return self.count;
          }
        };
      }, {count: 2});
      
      var one = Share.create('one'), two = Share.create('two');
      one.append('dub', true); // _data is now {'dub': true}
      two.append('dub', false); // _data is now {'dub': false}
      two.append('bleh', [1, 2, 3]); // _data is now {'dub': false, 'bleh': [1,2,3]}
      
      expect(Share.count).to.be(4);
      expect(Share.count).to.equal(one.getCount());
      expect(one.data()).to.eql({'dub': false, 'bleh': [1,2,3]});
    },
    
    testClassNames: function (){

      expect(Class.$className).to.equal('ES5Class');
      expect(Animal.$className).to.equal('Animal');
      expect(Dog.$className).to.equal('Dog');
      expect(Beagle.$className).to.equal('Beagle');

      expect(animal.$class.$className).to.equal('Animal');
      expect(bird.$class.$className).to.equal('Bird');
      expect(bird.$class.$parent.$className).to.equal('Animal');

      expect(dog.$class.$className).to.equal('Dog');
      expect(dog.$class.$parent.$className).to.equal('Animal');
      expect(beagle.$class.$className).to.equal('Beagle');
      expect(beagle.$class.$parent.$className).to.equal('Animal');
      expect(beagle.$class.$parent.$parent.$className).to.equal('ES5Class');

    },

    testPrivateAndDataShare: function (){

      expect(privat.items().length).to.equal(4);
      expect(privat.items()).to.eql([1, 2, 3, 4]);
      
      privat.push(5);
      
      expect(privat.items()).to.eql([1, 2, 3, 4, 5]);
      
      privat.reset();
     
      expect(privat.items()).to.eql([]);
      
      privat.push(6);
      
      expect(privat.items()[0]).to.equal(6);
      expect(privat.private).to.equal('yes');
      expect(privat.privateGet()).to.equal('yes');
      expect(Privat.deal()).to.equal(0);
      
      privat2.push(13);
      
      expect(privat2.items().length).to.equal(2);
      expect(privat.items()).to.eql([6, 13]);

    },

    testUseStrict: function (){
      'use strict';

      /* 
       Overriding a non-writable value would throw an error in Strict Mode
       For now it fails silently, so we're just checking that the value can't be changed
       */

      expect(function (){
        bird.$class.$className = 'trying to modify className';
      }).to.throwException();

      expect(function (){
        Bird.prototype.$class = function (){};
      }).to.throwException();

      expect(function (){
        Class.prototype.$instanceOf = function (){};
      }).to.throwException();

    },

    testProtectedMethods: function (){

      var temp = bird.$class.$className;
      bird.$class.$className = 'trying to modify className';
      expect(bird.$class.$className).to.equal(temp);

      temp = Bird.prototype.$class;
      Bird.prototype.$class = function (){};
      expect(Bird.prototype.$class).to.equal(temp);

      temp = Class.prototype.$instanceOf;
      Class.prototype.$instanceOf = function (){};
      expect(Class.prototype.$instanceOf).to.equal(temp);

    },

    testConstructor: function (){
      expect(typeof Bird).not.to.be('function');
      expect(Bird.create).to.be.ok();
    }
  }
};