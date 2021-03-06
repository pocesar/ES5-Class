describe('ES5Class', function (){
  var
    onTheBrowser = (typeof window !== 'undefined' && window === global),
    Animal,
    Bird,
    Dog,
    Beagle,
    Color,
    Privat,
    animal,
    beagle,
    bird,
    dog,
    color,
    privat,
    privat2;

  before(function (){
    Animal = ES5Class.$define(
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

    Bird = Animal.$define(
      'Bird',
      {
        construct: function ($super, name){
          $super(name);
          this.canFly = true;
        }
      },
      {
        count: 0
      }
    );

    Color = ES5Class.$define('Color', {
      setColor: function (name){
        this.color = name;
      }
    }, {
      color: 'brown'
    });

    Dog = Animal.$define('Dog', {
      construct: function (name){
        this.name = name;
      }
    }, {
      run: function (){
        this.ran += 20;
      }
    });

    Dog.$include({
      cry: function (){
        return 'wof!';
      }
    });

    Dog.$implement([
      {
        isBig: true
      },
      Color
    ]);

    Beagle = Animal.$define('Beagle');
    Beagle.$implement([Dog, Color]);
    Beagle.$include({
      construct: function (name){
        this.name = name;
        this.setColor('white and brown');
      }
    });
    Beagle.isBig = false;

    Privat = ES5Class.$define('Private', function (){
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

    Privat.$include(function (){
      var another_private = 'yes';

      return {
        'private'   : another_private,
        'privateGet': function (){
          return another_private;
        }
      };
    });

    Privat.$implement(function (){
      var deal = -1;

      return {
        deal: function (){
          return ++deal;
        }
      };
    });

    animal = Animal.$create('An Animal');
    bird = Bird.$create('A Bird');
    dog = Dog.$create('A Dog');
    beagle = Beagle.$create('A Beagle');

    color = Color.$create();
    color.setColor('A color');

    privat = Privat.$create([1, 2, 3, 4]);
    privat2 = Privat.$create();
  });

  after(function (){
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
  });

  it('$destroy', function (){
    var
      anotherOtherObj = [],
      anotherObj = {
        yes: true
      },
      Base = ES5Class.$define('Base', {
        fromBase: anotherOtherObj
      }),
      Klass = Base.$define('Klass', {
        construct: function (){
          this.anotherObject = anotherObj;
        },
        defineObj: function (doh){
          this.defined = doh;
        }
      }, {
        obj: anotherObj
      }),
      klass = new Klass(anotherObj);

    klass.defineObj(anotherOtherObj);

    expect(klass.$arguments[0]).to.be(anotherObj);
    expect(klass.$arguments.length).to.be(1);
    expect(klass.anotherObject).to.be(anotherObj);
    expect(klass.$class.obj).to.be(anotherObj);
    expect(klass.fromBase).to.be(anotherOtherObj);

    klass.$destroy();

    expect(anotherObj).to.eql({yes: true});
    expect(anotherOtherObj).to.eql([]);
    expect(klass.$arguments).to.eql([]);
    expect(klass.defined).to.be(undefined);
    expect(klass.anotherObject).to.be(undefined);
    expect(klass.fromBase).to.eql([]);

    klass = new Klass();

    expect(klass.$arguments).to.eql([]);
    klass.$destroy();
    expect(klass.$arguments).to.eql([]);
  });

  it('configurable prototype functions can be changed', function (done){
    var Cls = ES5Class.$define('Cls', {
      $destroy: function (){
        done();
      }
    });

    Cls.$create().$destroy();
  });

  it('delete declarated values from prototype', function (){
    var Test = ES5Class.$define('Test', {
      construct : function (){
        this.inner = true;
      },
      declarated: {
        member: true
      },
      deleteIt  : function (){
        delete this.declarated;
      }
    });
    var test = new Test();

    expect(test.declarated.member).to.equal(true);
    expect(test.inner).to.equal(true);

    test.deleteIt();
    delete test.inner;

    expect(test.inner).to.be.an('undefined');
    expect(test.declarated.member).to.equal(true);

    delete Test.prototype.declarated;

    expect(test.declarated).to.be.an('undefined');
    delete test.$arguments;

    var newtest = new Test();

    expect(newtest.declarated).to.be.an('undefined');
    expect(test.$arguments).to.eql([]);
  });

  it('empty class on null $implement / $include', function (){
    var Cls = ES5Class.$define('Cls');

    Cls.$implement(null);
    Cls.$include(null);
    Cls.$include(function(){});
    Cls.$implement(function(){});

    expect(Cls.$create()).to.eql({});
  });

  it('$names', function (){
    expect(beagle.$names).to.eql(['name', 'color']);
  });

  it('exchange proto', function (done){
    if (onTheBrowser) {
      // skip on browser
      return done();
    }
    var EM = require('events').EventEmitter;

    var baseCls = ES5Class.$define('BaseCls', {
      originalFunction: function (){},
      originalValue   : true
    }, {
      originalClassValue: true
    }).$create();

    var otherClass = ES5Class.$define('otherClass', {
      construct: function (dah){
        this.dah = dah;
      },
      duper    : function (){}
    });

    baseCls.$exchange(otherClass, [true]);

    expect(baseCls.dah).to.be(true);
    expect(baseCls.duper()).to.be.an('undefined');

    baseCls.$exchange(EM);

    expect(baseCls).to.not.have.property('originalFunction');
    expect(baseCls).to.not.have.property('originalValue');

    baseCls.on('test', function (value){
      expect(value).to.be(1);
      expect(baseCls instanceof EM).to.be(true);

      var Server = require('http').Server;

      ES5Class.prototype.$exchange.call(baseCls, Server, []);

      expect(baseCls instanceof Server).to.be(true);

      ES5Class.prototype.$exchange.call(baseCls, {}, []);

      expect(baseCls instanceof Server).to.be(true);
      done();
    });

    baseCls.emit('test', 1);
  });

  it('new import after instantiated', function (){
    var BaseCls = ES5Class.$define('BaseCls', {
      fromPrototype: function (){
        this.$class.value = true;
        return false;
      }
    }, {
      fromStaticToPrototype: function (){ return this.$class.value; }
    });

    var NewCls = ES5Class.$define('NewCls');

    var newCls = NewCls.$create();
    newCls.$import(BaseCls.prototype);

    expect(newCls).to.have.property('fromPrototype');
    expect(newCls).to.not.have.property('fromStaticToPrototype');

    newCls.$import(BaseCls);

    expect(newCls).to.have.property('fromStaticToPrototype');
    expect(newCls.fromPrototype()).to.equal(false);
    expect(newCls.fromStaticToPrototype()).to.equal(true);

    newCls = new NewCls();
    newCls.$import(BaseCls);

    expect(newCls).to.have.property('fromStaticToPrototype');
    expect(newCls).to.not.have.property('fromPrototype');

    newCls = new NewCls();
    newCls.$import(BaseCls.prototype);

    expect(newCls).to.not.have.property('fromStaticToPrototype');
    expect(newCls).to.have.property('fromPrototype');

    newCls = new NewCls();
    newCls.$import(new BaseCls());

    expect(newCls).to.not.have.property('fromStaticToPrototype');
    expect(newCls).to.have.property('fromPrototype');

    newCls = new NewCls();
    newCls.$import(Error);

    expect(newCls.captureStackTrace).to.be(Error.captureStackTrace);
    expect(newCls).to.have.property('stackTraceLimit');

    newCls = new NewCls();
    newCls.$import([Error, BaseCls]);

    expect(newCls).to.have.property('stackTraceLimit');
    expect(newCls).to.have.property('fromStaticToPrototype');

    newCls = new NewCls();
    newCls.$import([function (){
      return {
        'fromClosure': function (){

        }
      };
    }]);

    expect(newCls).to.have.property('fromClosure');
  });

  it('subclassing', function (){
    var
      Sub = ES5Class.$define('Sub', {
        ok: function (){}
      }),
      Done = ES5Class.$define('Done', {
        construct: function (){
          this.superb = true;
        },
        Sub      : new Sub()
      }),
      Main = Done.$define('Main', {
        done: function (){}
      });

    var main = new Main();

    expect(main.Sub.$instanceOf(Sub)).to.be(true);
  });

  it('super construct', function(){
    var
      Base = ES5Class.$define('Base', {
        construct: function(){
          this.asdf = arguments[0];
        }
      }),
      Sub = Base.$define('Sub', {
        construct: function($super, asdf, ep) {
          $super(asdf, ep);
        }
      }),
      Ultra = Sub.$define('Ultra', {
        construct: function($super) {
          $super('asdf');
          expect(this.asdf).to.be('asdf');
        }
      });

      expect(Ultra.$create().asdf).to.be('asdf');
  });

  it('async $super', function (done){
    var func = (typeof setImmediate === 'function' ? setImmediate : setTimeout);

    var Base = ES5Class.$define('Base', {
      construct: function (isset){
        var self = this;

        func(function (){
          self.isset = isset;
        }, 0);
      },
      asdf     : function (asdf){
        this.fdsa = asdf;
      }
    }), Shelf = Base.$define('Shelf', {
      construct: function ($super){
        var self = this;

        func(function (){
          self.asdf();
          $super(false);
        }, 0);

        func(function (){
          $super(true);

          func(function (){
            expect(self.isset).to.be(true);
            expect(self.fdsa).to.be('asdf');
            done();
          }, 0);
        }, 0);
      },
      asdf     : function ($super){
        func(function (){
          $super('asdf');
        }, 0);
      }
    });

    Shelf.$create();
  });

  it('import getters and setters', function (done){
    if (onTheBrowser) {
      // skip for browser
      return done();
    }
    var http = require('http');
    var obj = {
      __proto__: http.IncomingMessage.prototype
    };

    obj.__defineGetter__('testGetter', function (){
      return 'testGetter';
    });
    obj.__defineSetter__('testSetter', function (value){
      this.value = value;
    });

    var Cls = ES5Class.$define('cls').$implement(obj, true);

    expect(Cls.testGetter).to.equal('testGetter');

    Cls.testSetter = 'stuff';
    expect(Cls.value).to.equal('stuff');
    expect(obj.value).to.be.an('undefined');

    obj = {
      that: '',
      get val () {
        return this.that;
      },
      set val (val) {
        this.that = val;
      }
    };

    Cls.$implement(obj);
    expect(Cls.that).to.be('');
    Cls.val = 10;
    expect(Cls.val).to.be(10);

    done();
  });

  describe('$implement', function(){

    it('ES5Class', function(){
      var Base = ES5Class.$define('Base', {
        proto: 1
      }, {
        static: 1
      }), Sub = ES5Class.$define('Sub');

      Sub.$implement(Base);

      expect(Sub.static).to.be(Base.static);
      Base.proto = 2;
      expect(Sub.static).to.be(1);
      Base.prototype.proto = 2;
      expect(Sub.$create().proto).to.be(1);
    });

    it('retain non primitive object reference', function(){
      var obj = {
        one: 1,
        two: 2
      }, Base = ES5Class.$define('Base', {
        obj: obj
      }), Sub = ES5Class.$define('Sub');

      Sub.$implement(Base);

      expect(Sub.$create().obj.one).to.be(1);
      obj.one = 2;
      expect(Sub.$create().obj.one).to.be(obj.one);
    });

    it('closure', function(){
      var
        Mixin1 = ES5Class.$define('Mixin1', {}, {'one':function(){}}),
        Mixin2 = ES5Class.$define('Mixin2', {}, {'two':function(){}}),
        obj = [Mixin1, Mixin2];

      var Mixined = ES5Class.$define('Mixined');
      Mixined.$implement(function(){
        return obj;
      });
      Mixined.$include(function(){
        return obj;
      });

      expect(Mixined.$implements).to.eql(obj);
      expect(Mixined.prototype.one).to.be(Mixin1.one);
    });

  });

  it('old school new operator', function (done){
    var NewCls, Cls = ES5Class.$define('Cls', {
      construct: function (test){
        this.test = test;
      }
    }), cls = new Cls('new'), obj = {
      called: function (called){
        return this.test + ': ' + called;
      }
    };

    expect(cls.test).to.equal('new');

    Cls.$include(obj);

    expect(cls.called('yes')).to.equal('new: yes');

    NewCls = Cls.$define('NewCls', {
      called: function ($super){
        return $super('no');
      }
    });

    expect((new NewCls('yes')).called()).to.equal('yes: no');

    if (!onTheBrowser) {
      // skip for browser
      var
        NewBuffer = ES5Class.$define('NewBuffer', {
          test: function (){
            return true;
          }
        }).$implement(Buffer, true),
        newbuffer;

      newbuffer = new NewBuffer(4);
      expect(newbuffer.write).to.be.a('function');
      expect(newbuffer.length).to.equal(4);
      expect(newbuffer.test()).to.equal(true);
    }

    done();
  });

  it('version', function (){
    expect(ES5Class.$version).to.be.a('string');
    expect(/.\..\../.test(ES5Class.$version)).to.equal(true);
  });

  it('enumerables', function (){
    var Cls = ES5Class.$define('Cls', {
      construct: function (name){
        this.name = name;
        this.loaded = false;
      },
      isTrue   : function (){
        return true;
      }
    }, {
      isFalse: function (){
        return false;
      }
    });

    expect(Object.keys(Cls)).to.eql(['isFalse']);
    expect(Object.keys(new Cls('My Name'))).to.eql(['name', 'loaded']);
  });

  it('setImmediate', function (done){
    if (onTheBrowser) {
      // skip for browser
      return done();
    }
    var MyEventClass = ES5Class.$define('MyEventEmitter', function (){
      var base = this;
      base.$implement(require('events').EventEmitter, true);

      return {
        construct: function (){
          var self = this;

          setImmediate(function (){
            self.emit('created', base);
          });
        }
      };
    });

    var instance = MyEventClass.$create();

    instance.on('created', function (base){
      expect(base).to.eql(MyEventClass);
      expect(base.prototype.on).to.be.a('function');
      done();
    });

    expect(instance._events).to.be.an('object');
  });

  it('test examples', function (done){
    var MyError = ES5Class.$define('MyError').$inherit(Error);

    expect(MyError.$create() instanceof Error).to.be(false);
    expect(MyError.$create().$instanceOf(Error)).to.be(true);

    if (onTheBrowser) {
      // skip for browser
      return done();
    }
    var MyBufferEmitter = ES5Class.$define('MyBufferEmitter');

    MyBufferEmitter.$inherit(require('events').EventEmitter, []); // inherits from EventEmitter, append to your class prototype and call the constructor with an empty argument list
    MyBufferEmitter.$inherit(Buffer); // inherits from buffer, append to your class prototype

    var mbe = new MyBufferEmitter(4); // calls Buffer.apply(this, 4); and EventEmitter.apply(this, []);

    mbe.on('event', function (data){
      this.write(data);
      expect(this.toString()).to.equal('asdf');
      done();
    });

    expect(mbe.$instanceOf(Buffer)).to.be(true);
    expect(mbe.$instanceOf(require('events').EventEmitter)).to.be(true);

    mbe.emit('event', 'asdf');
  });

  it('$inherit from buffer', function (done){
    if (onTheBrowser) {
      // skip for browser
      return done();
    }
    var MyBuffer = ES5Class.$define('MyBuffer').$inherit(Buffer);

    var buf = MyBuffer.$create(4);

    expect(MyBuffer.prototype.write).to.be.a('function');
    expect(buf.parent).to.be.an('object');
    expect(buf.write).to.be.a('function');
    expect(buf.length).to.equal(4);

    expect((new MyBuffer(4)).parent).to.be.an('object');

    MyBuffer = ES5Class.$define('MyBuffer2').$inherit(Buffer, [4]);

    buf = MyBuffer.$create();

    expect(buf.length).to.equal(4);
    expect((new MyBuffer()).length).to.be(4);
    done();
  });

  describe('$wrap', function(){
    it('wraps functions or objects', function(){
      var obj = {}, fn = function(){};

      obj = ES5Class.$wrap(obj);
      fn = ES5Class.$wrap(fn);
      expect(obj.$className).to.be('Wrapped');
      expect(fn.$className).to.be('Wrapped');
      expect(ES5Class.$wrap(obj)).to.be(obj);
      expect(ES5Class.$wrap(fn)).to.be(fn);
    });

    it('ignores invalid parameters', function(){
      var bool = false, str = '';

      expect(ES5Class.$wrap(bool).$create().$names).to.eql([]);
      expect(ES5Class.$wrap(str).$create().$names).to.eql([]);
    });

    it('existing ES5Class are returned by default', function(){
      var Cls = ES5Class.$define('Cls');

      expect(ES5Class.$wrap(Cls)).to.be(Cls);
    });
  });

  describe('$const', function(){
    it('readonly', function(){
      var obj = {
          cant:'touch this',
          fn : function(){ return this.cant; },
          get s(){ return this.cant; },
          set s(v){ this.cant = v; }
        },
        Cls = ES5Class.$define('Cls');

      Cls.$const(obj);
      expect(Cls.cant).to.be('touch this');
      expect(Cls.fn()).to.be('touch this');
      expect(Cls.s).to.be('touch this');
      Cls.cant = true;
      Cls.s = true;
      expect(Cls.cant).to.be('touch this');
      delete Cls.cant;
      expect(Cls.cant).to.be('touch this');
      expect(Cls.s).to.be('touch this');
      expect(Cls.fn()).to.be('touch this');
    });

    it('throws in strict mode', function(){
      'use strict';

      var Cls = ES5Class.$define('Cls').$const({
        isConst: true
      });

      expect(function(){
        Cls.isConst = false;
      }).to.throwException();
    });

    it('accepts a function', function(){
      var Cls = ES5Class.$define('Cls');

      Cls.$const(function(){
        expect(this).to.be(Cls);

        return {
          constant: 1
        };
      });

      expect(Cls.constant).to.be(1);
    });

    it('appends to prototype', function(){
      var Cls = ES5Class.$define('Cls');

      Cls.$const(function(){
        expect(this).to.be(Cls);

        return {
          constant: 1
        };
      }, true);

      expect(Cls.constant).to.be(undefined);
      expect(Cls().constant).to.be(1);

      var inst = Cls.$create();

      expect(function(){
        inst.$destroy();
      }).to.not.throwException();

      expect(inst.constant).to.be(1);
    });

    it('invalid $const', function(){
      var Cls = ES5Class.$define('Cls');

      expect(function(){
        Cls.$const(false);
        Cls.$const('');
        Cls.$const(0);
        Cls.$const(0, true);
        Cls.$const('', true);
        Cls.$const(true, true);
        Cls.$const(function(){});
      }).to.not.throwException();
    });

    it('inherits const from base class', function(){
      var
        Base = ES5Class.$define('Base')
          .$const({myConst: 1})
          .$const({myProtoConst: 1}, true),
        Sub = Base.$define('Sub');

      expect(Sub.myConst).to.be(Base.myConst);
      expect(Sub.$create().myProtoConst).to.be(Base.prototype.myProtoConst);
    });

    it('applies writable false when mixin', function(){
      var
        Base = ES5Class.$define('Base')
          .$const({myConst: 1})
          .$const({myProtoConst: 1}, true),
        Sub = ES5Class.$define('Sub');

      Sub.$implement(Base);
      expect(Sub.myConst).to.be(Base.myConst);
      expect(Sub.$create().myProtoConst).to.be(Base.prototype.myProtoConst);

      Sub.myConst = 2;
      expect(Sub.myConst).to.be(1);
    });
  });

  describe('$delegate', function (){

    it('submember delegation', function(){
      var Cls = ES5Class.$define('Cls', {
        subObject: {
          delegation: function (val){
            return !!val;
          }
        }
      }, {
        delegated: function (argument){
          return argument;
        }
      });

      expect(Cls.delegated('asdf')).to.be('asdf');

      var cls = new Cls();

      cls.$delegate().method('delegated');

      expect(cls.delegated('asdf')).to.be('asdf');

      cls.$delegate('subObject').method({name: 'delegation', as: 'doh'});

      expect(cls.doh('adsf')).to.be(true);
    });

  });

  it('$isES5Class', function (){
    var FALSE = false, arr = [], obj = {}, fn = function (){}, Cls = ES5Class.$define('Cls');

    expect(ES5Class.$isES5Class(FALSE)).to.be(false);
    expect(ES5Class.$isES5Class(arr)).to.be(false);
    expect(ES5Class.$isES5Class(obj)).to.be(false);
    expect(ES5Class.$isES5Class(fn)).to.be(false);
    expect(ES5Class.$isES5Class(Cls)).to.be(true);
  });

  it('direct class mixin', function (){
    var
      Class1 = ES5Class.$define('Class1', {
        isTrue: function (){
          return true;
        }
      }, {
        isFalse: function (){
          return false;
        }
      }),
      Class2 = ES5Class.$define('Class2', Class1);

    expect(Class2.$create().isTrue).to.be.an('undefined');
    expect(Class2.isFalse).to.be.an('undefined');
    expect(Class2.$create().isFalse()).to.equal(false);
    expect(Class2.$implements).to.eql([]);

    Class2.$implement([Class1, Class1]); // $implement twice has no effect
    Class2.$implement({prototype: {}}); // dummy prototype
    Class2.$include({prototype: {}}); // dummy prototype

    Class2.$inherit(Class1); // $implement twice has no effect
    expect(Class2.isFalse()).to.equal(false);
    expect(Class2.$create().isTrue()).to.equal(true);
    expect(Class2.$implements).to.eql([Class1]);
  });

  it('array implement include', function (){
    var Bases = [
      ES5Class.$define('Base1', {
        one: function (){
          return true;
        }
      }, {
        yes     : function (){
          return 'yes';
        },
        included: true
      }),
      ES5Class.$define('Base2', {
        two: function (){
          return true;
        }
      }, {
        included: false
      }),
      ES5Class.$define('Base3', {
        one  : function (){
          return false;
        },
        two  : function (){
          return false;
        },
        three: function (){
          return this.two();
        }
      }),
      {
        four: function (){
          return 'four';
        }
      }
    ];

    var Instance = ES5Class.$define('Instance', Bases);
    var instance = Instance.$create();

    expect(instance.yes).to.be.a('function');
    expect(instance.included).not.to.be.an('undefined');
    expect(instance.one).to.be.an('undefined');
    expect(instance.two).to.be.an('undefined');
    expect(instance.four).to.be.a('function');
    expect(instance.yes()).to.equal('yes');
    expect(instance.four()).to.equal('four');
    expect(instance.included).to.equal(false);

    Instance = ES5Class.$define('Instance', {}, Bases);

    expect(Instance.one).to.be.an('undefined');
    expect(Instance.two).to.be.an('undefined');
    expect(Instance.four).to.be.a('function');
    expect(Instance.yes).to.be.a('function');
    expect(Instance.four()).to.equal('four');
    expect(Instance.yes()).to.equal('yes');
    expect(Instance.$create().three()).to.equal(false);
    expect(Instance.$implements).to.eql(Bases.slice(0, -1));
  });

  it('instance without create', function (){
    var S = ES5Class.$define('S', {
      construct: function (lol){
        this.lol = lol;
      },
      test     : function (extra){
        return this.lol + (extra || '');
      }
    }), s = S('rofl');

    expect(s).to.be.an('object');
    expect(S.$create('lol').test()).to.equal('lol');
    expect(S('lmao').test('!')).to.equal('lmao!');
  });

  it('implement EventEmitter', function (done){
    if (onTheBrowser) {
      // skip for browser
      return done();
    }
    var AlmostEmptyClass = ES5Class.$define('AlmostEmptyClass', {
      lambda: true
    });

    AlmostEmptyClass.$implement(require('events').EventEmitter, true);

    var aec = AlmostEmptyClass.$create();

    expect(aec.lambda).to.equal(true);
    expect(aec.on).to.be.a('function');

    aec.on('true', function (value){
      expect(value).to.equal(true);
      done();
    });

    expect(aec._events).to.be.an('object');

    aec.emit('true', true);
  });

  it('array mixin', function (){
    var Class1 = ES5Class.$define('Class1', {}, {done: true}),
      Class2 = ES5Class.$define('Class2', {func: function (){ return true; }}),
      Class3 = ES5Class.$define('Class3', {}, {yet: true});

    var NewClass = ES5Class.$define('NewClass', {}, [Class1, Class2, Class3]);

    Class1.done = false;

    expect(NewClass.done).to.equal(true);
    expect(NewClass.yet).to.equal(true);
    expect(NewClass.$parent).to.eql(ES5Class);
    expect(NewClass.$implements).to.eql([Class1, Class2, Class3]);
    expect(NewClass.$create().func()).to.equal(true);
    expect(NewClass.$create().$class.done).to.equal(true);

    expect(NewClass.$create().func()).to.equal(true);

    NewClass.done = false;

    var NewClass2 = Class2.$define('NewClass2', {}, [Class1, Class3]);

    expect(NewClass2.$create().func()).to.equal(true);

    Class2.$include({
      func: function (){
        return false;
      }
    });

    expect(NewClass2.$create().func()).to.equal(false);
    expect(NewClass2.done).to.equal(false);
  });

  it('class accesses', function (){
    var h = ES5Class.$define('Class', function (){
      return {
        done: function (){
          expect(this.$class.property).to.equal(true);
          expect(this.property).to.be.an('undefined');
          expect(this.dupe).to.be.an('undefined');
          expect(this.$class.dupe()).to.equal('dupe');

          this.$class.property = false;
        }
      };
    }, {
      property: true,
      dupe    : function (){
        expect(this.property).to.equal(true);
        return 'dupe';
      }
    });

    expect(h).to.eql(h.$class);

    h.$create().done();
    expect(h.property).to.equal(false);

    h.property = true;
    expect(h.dupe()).to.equal('dupe');
    expect(h.property).to.equal(true);
    expect(h.$className).to.equal('Class');
  });

  it('Duck typing', function (){

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
        return (number) * (this.number);
      }
    });

    var Div = Op.$define('Divide', {
      operator: function (number){
        return (number) / (this.number);
      }
    });

    var Sum = Op.$define('Sum', {
      operator: function (number){
        return (number) + (this.number);
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
    expect(Operation.add([sum, mul, div]).result()).to.equal(350);
    var mul2 = Mul.$create(30);
    expect(Operation.onthefly([div, sum, mul, mul2])).to.equal(67500);
  });

  it('singleton', function (){

    var Test = ES5Class.$define('Test', {}, {
      test: function (){
        return 'Test::';
      }
    });

    expect(Test.test()).to.equal('Test::');

    Test.$implement({
      test: function ($super){
        return 'New::' + $super();
      }
    });

    expect(Test.test()).to.equal('New::Test::');

    Test.$implement({
      test: function ($super){
        return 'And::' + $super();
      }
    });

    var NewTest = Test.$define('NewTest');

    expect(Test.test()).to.equal('And::New::Test::');

    expect(NewTest.test()).to.equal('And::New::Test::');

    NewTest.$implement({
      test: function ($super){
        return 'NewTest::' + $super();
      }
    });

    expect(Test.test()).to.equal('And::New::Test::');
    expect(NewTest.test()).to.equal('NewTest::And::New::Test::');

  });

  it('call to inexistant $super should have no effect', function (){
    var Cls = ES5Class.$define('Cls', {
      construct: function ($super){
        this.dont = true;
        $super('sdfa');
      }
    });

    var S = Cls.$define('S', {
      dope: function ($super){
        return $super('asdf');
      }
    });

    var Sub = S.$define('Sub', {
      dope: function ($super){
        return $super('asdf');
      }
    });

    expect(Sub.$create().dope()).to.be.an('undefined');
  });

  it('really long construct arguments', function (){
    var Cls = ES5Class.$define('Cls', {
      construct: function (a1, a2, a3, a4, a5, a6, a7){
        this.data = [a1, a2, a3, a4, a5, a6, a7].join(',');
      }
    }), Sub = Cls.$define('Sub');

    expect(Sub.$create(1, 2, 3, 4, 5, 6, 7).data).to.equal('1,2,3,4,5,6,7');
    expect(Sub.$create(1, 2, 3, 4, 5, 6).data).to.equal('1,2,3,4,5,6,');
    expect(Sub.$create(1, 2, 3, 4, 5).data).to.equal('1,2,3,4,5,,');
    expect(Sub.$create(1, 2, 3, 4).data).to.equal('1,2,3,4,,,');
    expect(Sub.$create(1, 2, 3).data).to.equal('1,2,3,,,,');
    expect(Sub.$create(1, 2).data).to.equal('1,2,,,,,');
    expect(Sub.$create(1).data).to.equal('1,,,,,,');
  });

  it('overload', function (){

    var ES5Person = ES5Class.$define('ES5Person', {
      construct : function (name){
        this.name = name;
      },
      setAddress: function (country, city, street){
        this.country = country;
        this.city = city;
        this.street = street;
      }
    });

    var ES5FrenchGuy = ES5Person.$define('ES5FrenchGuy', {
      setAddress: function ($super, city, street){
        $super('France', city, street);
      }
    });

    var ES5ParisLover = ES5FrenchGuy.$define('ES5ParisLover', {
      setAddress: function ($super, street){
        $super('Paris', street);
      }
    });

    var p40 = ES5ParisLover.$create('Mary');

    expect(p40.setAddress).to.be.a('function');

    p40.setAddress('CH');

    expect(p40.name).to.be('Mary');
    expect(p40.street).to.be('CH');
    expect(p40.city).to.be('Paris');
    expect(p40.country).to.be('France');

  });

  it('class define', function (){
    expect(function (){
      ES5Class.$define();
    }).to.throwException();

    expect(ES5Class.$define('SubClass')).to.be.ok();
    expect(ES5Class.$define('SubClass', {}, {})).to.be.ok();
  });

  it('classes', function (){
    expect(Animal).to.be.ok();
    expect(Bird).to.be.ok();
    expect(Dog).to.be.ok();
    expect(Beagle).to.be.ok();
    expect(Color).to.be.ok();
    expect(Privat).to.be.ok();
  });

  it('instances', function (){
    expect(animal).to.be.ok();
    expect(bird).to.be.ok();
    expect(dog).to.be.ok();
    expect(beagle).to.be.ok();
    expect(privat).to.be.ok();
  });

  it('class properties', function (){

    expect(Animal.count).to.equal(2);
    expect(Animal.$implements).to.eql([]);

    expect(Bird.count).to.equal(1);
    expect(Dog.isBig).to.equal(true);
    expect(Beagle.isBig).to.equal(false);
    expect(Beagle.color).to.equal('brown');

    expect(Beagle.count).to.be(0);

    expect(Beagle.$implements[0].$isClass(Bird)).to.be(false);
    expect(Beagle.$implements[0].$isClass(Animal)).to.be(false);
    expect(Beagle.$implements[0].$isClass(Dog)).to.be(true);
    expect(Beagle.$implements[1].$isClass(Color)).to.be(true);

  });

  it('instance properties', function (){

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

  });

  it('instance of', function (){

    expect(animal.$instanceOf).to.be.ok();
    expect(privat.$instanceOf).to.be.ok();
    expect(privat.$instanceOf(Privat)).to.be(true);
    expect(animal.$instanceOf(Animal)).to.be(true);
    expect(animal.$instanceOf(Privat)).to.be(false);
    expect(animal.$instanceOf(function (){})).to.be(false);

  });

  it('is class', function (){

    expect(animal.$isClass(Animal)).to.be.ok();
    expect(animal.$isClass(ES5Class)).not.to.be.ok();
    expect(privat.$isClass(Privat)).to.be.ok();
    expect(privat.$isClass(ES5Class)).not.to.be.ok();

  });

  it('inheritance', function (){

    expect(animal.$instanceOf(Animal)).to.equal(true);
    expect(animal instanceof Animal).to.equal(true);
    expect(animal.$instanceOf(ES5Class)).to.equal(true);
    expect(animal instanceof ES5Class).to.equal(true);
    expect(animal.$instanceOf(Bird)).to.equal(false);
    expect(animal instanceof Bird).to.equal(false);

    expect(bird.$instanceOf(Bird)).to.equal(true);
    expect(bird instanceof Bird).to.equal(true);
    expect(bird.$instanceOf(Animal)).to.equal(true);
    expect(bird instanceof Animal).to.equal(true);
    expect(bird.$instanceOf(ES5Class)).to.equal(true);

    expect(dog.$instanceOf(Dog)).to.equal(true);
    expect(dog instanceof Dog).to.equal(true);
    expect(dog.$instanceOf(ES5Class)).to.equal(true);
    expect(dog instanceof ES5Class).to.equal(true);
    expect(dog.$instanceOf(Animal)).to.equal(true);
    expect(dog instanceof Animal).to.equal(true);
    expect(dog.$instanceOf(Bird)).to.equal(false);
    expect(dog instanceof Bird).to.equal(false);

    expect(beagle.$instanceOf(Beagle)).to.equal(true);
    expect(beagle.$instanceOf(ES5Class)).to.equal(true);
    expect(beagle.$instanceOf(Dog)).to.equal(false);
    expect(beagle.$instanceOf(Animal)).to.equal(true);
    expect(beagle.$instanceOf(Bird)).to.equal(false);
    expect(beagle.$instanceOf(Color)).to.equal(false);

  });

  it('inherited methods', function (){
    expect(bird.getName).to.be.ok();
    expect(bird.getName()).to.equal('A Bird');
    expect(dog.cry()).to.equal('wof!');
    expect(beagle.cry()).to.equal('wof!');
  });

  it('$include with a child ES5Class', function (){
    var
      Klass = ES5Class.$define('Klass'),
      obj = {
        klass: new Klass()
      }, Base = ES5Class.$define('Base');

    Base.$include(obj);

    expect(Base.$create().klass).to.be(obj.klass);
  });

  it('extending base', function (){
    var Base = ES5Class.$define('Base', {
      done: function (){
        this.$class.count++;
      }
    }, {
      count: 1
    });

    var Next = Base.$define('Next', {}, {
      count: 0
    });

    expect(Base.count).to.equal(1);
    expect(Next.count).to.equal(0);

    var base = Base.$create();
    var next = Next.$create();

    base.done();
    next.done();

    expect(Base.count).to.equal(2);
    expect(Next.count).to.equal(1);

    Base.$include({
      included: function (){
        this.$class.count++;
        return true;
      }
    });

    Base.$implement({
      implemented: function (){
        this.count++;
        return true;
      },
      parented   : function (){
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

    Next.$implement({
      implemented: function (item){
        return typeof item !== 'undefined' ? item : void 0;
      },
      another    : function (){
        return this.$parent.implemented();
      },
      other      : function (){
        return this.implemented(false);
      }
    });

    expect(Next.count).to.equal(3);
    expect(Base.count).to.equal(4);
    expect(Next.implemented()).to.be.an('undefined');
    expect(Next.another()).to.equal(true);
    expect(Next.other()).to.equal(false);
  });

  it('closure parent method', function (){
    var Clss = ES5Class.$define('Clss', {}, function (){
      return {
        factory: function (oval){
          this.oval = oval;
          return this;
        }
      };
    });

    var Clsss = Clss.$define('Clsss', {}, function ($super){
      expect(this.factory).to.be.ok();
      expect(this.factory).to.be($super.factory);

      return {
        factory: function (oval){
          expect($super).to.be(Clss);
          $super.factory.call(this, oval);
          return this;
        }
      };
    });

    expect(Clsss.factory(true).oval).to.be(true);

    var Cls = Clsss.$define('Cls', {}, {
      factory: function ($super){
        $super(false);
        return this;
      }
    });

    expect(Cls.factory().oval).to.equal(false);
  });

  it('closure parent instance', function (){

    var Clss = ES5Class.$define('Clss', function (){
      return {
        construct: function (oval){
          this.oval = oval;
        }
      };
    });

    var Clsss = Clss.$define('Clsss', function ($super){
      expect(this.prototype.construct).to.be.ok();
      expect(this.prototype.construct).to.be($super.construct);

      return {
        construct: function (oval){
          expect($super).to.be(Clss.prototype);
          $super.construct.call(this, oval);
        }
      };
    });

    expect(Clsss.$create(true).oval).to.be(true);
  });

  it('closures', function (){
    var Count = ES5Class.$define('Count', {}, {
      count: 0
    });

    var Share = Count.$define('Share', function (){
      var _data = {}, self = this;

      return {
        construct: function (){
          this.$class.count++;
        },
        append   : function (name, data){
          _data[name] = data;
        },
        data     : function (){
          return _data;
        },
        getCount : function (){
          return self.count;
        }
      };
    }, {count: 2});

    var one = Share.$create('one'), two = Share.$create('two');
    one.append('dub', true); // _data is now {'dub': true}
    two.append('dub', false); // _data is now {'dub': false}
    two.append('bleh', [1, 2, 3]); // _data is now {'dub': false, 'bleh': [1,2,3]}

    expect(Share.count).to.be(4);
    expect(Share.count).to.equal(one.getCount());
    expect(one.data()).to.eql({'dub': false, 'bleh': [1, 2, 3]});
  });

  it('class names', function (){

    expect(ES5Class.$className).to.equal('ES5Class');
    expect(Animal.$className).to.equal('Animal');
    expect(Dog.$className).to.equal('Dog');
    expect(Beagle.$className).to.equal('Beagle');

    expect(animal.$class.$className).to.equal('Animal');
    expect(bird.$class.$className).to.equal('Bird');
    expect(bird.$class.$parent.$className).to.equal('Animal');

    expect(dog.$class.$className).to.equal('Dog');
    expect(dog.$className).to.equal('Dog');
    expect(dog.$className).to.equal(dog.$class.$className);
    expect(dog.$class.$parent.$className).to.equal('Animal');
    expect(beagle.$class.$className).to.equal('Beagle');
    expect(beagle.$class.$parent.$className).to.equal('Animal');
    expect(beagle.$class.$parent.$parent.$className).to.equal('ES5Class');

  });

  it('private and data share between instances', function (){

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

  });

  it('use strict', function (){
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
      ES5Class.prototype.$instanceOf = function (){};
    }).to.throwException();

  });

  it('no construct', function (){
    var Clss = ES5Class.$define('Clss', {test: true});

    expect(Clss.$create()).to.have.property('test');
  });

  it('protected methods', function (){

    var temp = bird.$class.$className;
    bird.$class.$className = 'trying to modify className';
    expect(bird.$class.$className).to.equal(temp);

    temp = Bird.prototype.$class;
    Bird.prototype.$class = function (){};
    expect(Bird.prototype.$class).to.equal(temp);

    temp = ES5Class.prototype.$instanceOf;
    ES5Class.prototype.$instanceOf = function (){};
    expect(ES5Class.prototype.$instanceOf).to.equal(temp);

  });

  it('toString and valueOf', function(){
    var Cls = ES5Class.$define('Cls', {
      toString: function(){
        return 'prototype';
      }
    }, {
      toString: function(){
        return 'static';
      }
    });

    expect('' + Cls()).to.be('prototype');
    expect('' + Cls).to.be('static');
    Cls.$implement({
      valueOf: function(){
        return 'static valueOf';
      }
    });
    Cls.$include({
      valueOf: function(){
        return 'prototype valueOf';
      }
    });
    expect('' + Cls()).to.be('prototype valueOf');
    expect('' + Cls).to.be('static valueOf');
  });

  it('constructor', function (){
    expect(typeof Bird).to.be('function');
    expect(Bird.$create).to.be.a('function');
  });

  describe('object composition', function(){

    // taken from npmjs.org/package/paladin for the awesomeness
    it('A javascript version of Moorcock\'s Stormbringer Saga', function(){
      /**
       * A javascript version of Moorcock's Stormbringer Saga
       */

      function Character () {
        this.name = '';
      }

      function Sorcerer () {
        return {
          cast: function(spell) {
            console.log(this.name + ' is casting ' + spell);
            return this;
          }
        };
      }

      function Warrior () {
        var weapon = '';
        return {
          setWeapon: function (weaponObject) {
            weapon = weaponObject;
            return this;
          },
          getWeapon: function() {
            return weapon;
          }
        };
      }

      function skills() {
        var _skills = [], skillsModule;
        skillsModule = {
          addSkill: function(name) {
            _skills.push(name);
            return skillsModule.addSkill;
          },
          getSkills: function() {
            return _skills;
          }
        };
        return skillsModule;
      }

      function Sword() {
        var name = '';
        this.prototype.setName = function(weaponName) {
          name = weaponName;
        };
        this.prototype.getName = function() {
          return name;
        };
      }

      function Demon() {
        this.suckLife = function() {
          console.log('I\'m sucking life out of my victim');
        };
      }

      function battleCast() {
        //console.log(this.name + ' is casting spells while wielding ' + this.getWeapon().getName() );
        return this.name + ' is casting spells while wielding ' + this.getWeapon().getName();
      }

      function destroyWorld() {
        //console.log('Blowing the Horn of Fate and destroying the world right now....');
        return 'Blowing the Horn of Fate and destroying the world right now....';
      }

      // create a sword that's also a demon
      var DemonSword = ES5Class.$define('DemonSword', [Sword, Demon]),
        // Stormbringer is the coolest sword in the universe
        Stormbringer = DemonSword.$define('Stormbringer', {
          construct: function($super) {
            $super();
            this.setName('Stormbringer');
          }
        }).$create()/*,
        // MournBlade is Stormbringer's twin blade
        MournBlade = DemonSword.$define('MournBlade', {
          construct: function($super){
            this.setName('MournBlade');
            $super();
          }
        }).$create()*/;

      expect(DemonSword.suckLife).to.be.a('function');
      // create the race of Melnibone'
      var Melnibonean = ES5Class.$define('Melnibonean', [Character, Sorcerer, Warrior]),
        // create Elric, the antihero and attach the battleCast method alised as fight
        Elric = Melnibonean.$define('Elric', {
          construct: function($super){
            $super();
            // set Elric's weapon to Stormbringer
            this.setWeapon(Stormbringer);
          },
          name: 'Elric',
          fight: battleCast,
          destroy: destroyWorld,
          // add the skills module (namespaced to skills)
          skills: skills()
        }).$create()/*,
        // Yrkoon is Elric's evil cousin who happens to wield MournBlade
        Yrkoon = Melnibonean.$define('Yrkoon', {
          construct: function ($super){
            // set Elric's weapon to Stormbringer
            this.setWeapon(MournBlade);
            $super();
          },
          name     : 'Yrkoon'
        })*/;

      expect(Melnibonean.prototype).to.have.keys(['cast','setWeapon','getWeapon']);
      // let's test everything works as supposed
      expect(Elric.fight()).to.be('Elric is casting spells while wielding Stormbringer');
      // this is interesting because addSkill() returns addSkill so you can chain brackets
      // until - of course - Elric destroys the world...
      Elric.skills.addSkill('Summon Arioch')('Be an Albino Prince')('Destroy World');
      // and let's print it out
      //console.log('Elric has the following skills: ' + Elric.skills.getSkills().join(', '));
      expect(Elric.skills.getSkills().join(', ')).to.be('Summon Arioch, Be an Albino Prince, Destroy World');
      expect(Elric.destroy()).to.be('Blowing the Horn of Fate and destroying the world right now....');
    });

  });
});