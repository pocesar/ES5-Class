(function (root, factory){
  /*istanbul ignore next:cant test*/
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(require('better-curry'));
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('ES5Class', ['better-curry'], factory);
  } else {
    // Browser globals
    root.ES5Class = factory(root.BetterCurry);
  }
}(this, function (BetterCurry){
  'use strict';

  /*istanbul ignore next:cant test*/
  if (!BetterCurry) {
    throw new Error('better-curry dependency is missing');
  }

  var
    hwp = Object.prototype.hasOwnProperty,
    gpd = Object.getOwnPropertyDescriptor,
    spo = Object.setPrototypeOf || function (obj, proto){
        obj.__proto__ = proto;
        return obj;
      },
    configurables = {
      '$destroy': true
    },
    filtered = {
      '$arguments': true,
      '$super': true,
      'prototype': true,
      '$original': true,
      '__length': true,
      '$currentContext': true
    },
    hasSuperRegex = /\([^\$]*\$super[^\)]*\)(?=\s*\{)/m;

  function functionWrapper(key, obj, superFn, context){
    if (!hasSuperRegex.test(obj[key])) {
      return obj[key];
    }

    var fn = BetterCurry.wrap(superFn, context, superFn.__length || obj[key].length, true);
    fn.$currentContext = context;

    var wrapped = function wrapped(){
      var self = this;

      if (fn.$currentContext !== self) {
        fn = BetterCurry.wrap(superFn, self, fn.__length || obj[key].length, true);
        fn.$currentContext = self;
      }

      if (arguments.length) {
        return obj[key].apply(self, BetterCurry.flatten([fn], arguments));
      } else {
        return obj[key].call(self, fn);
      }
    };

    wrapped.__length = fn.__length;

    return wrapped;
  }

  function count(obj) {
    var out = 0, i = null;
    for (i in obj) {
      out++;
    }
    return out;
  }

  function isArray(obj){
    return obj !== undefined && obj !== null &&  obj.constructor !== undefined &&
      obj.constructor === Array;
  }

  function isObject(obj){
    return obj !== undefined && obj !== null && obj.constructor !== undefined &&
    (obj.constructor === Object || Object.prototype.toString.call(obj) === '[object Object]');
  }

  function isFunction(obj){
    return obj !== undefined && obj !== null &&
      (obj.constructor === Function || typeof obj === 'function');
  }

  function isPlainFunction(object){
    return isFunction(object) &&
      (object['prototype'] === undefined || (count(object) === 0 && count(object.prototype) === 0)) &&
      !isES5Class(object);
  }

  function superApply(instance, object, args){
    if (object.$apply.length) {
      object.$apply.forEach(function eachApply(f){
        // dirty little hack to make classes like Buffer think the prototype is instanceof
        // itself when initializing the class
        spo(instance, f.obj.prototype);
        f.obj.apply(instance, f.args || args);
      });
      return true;
    }

    return false;
  }

  function isES5Class(object){
    return (isFunction(object) || isObject(object)) &&
      object['$className'] !== undefined &&
      object['$class'] !== undefined &&
      object.$class === object.constructor;
  }

  function applyArray(self, obj, args, check){
    var found = false;

    self.$apply.every(function (s){
      if (s.obj && s.obj === obj) {
        found = true;
        return false;
      }
      return true;
    });

    if (found === false && check !== true) {
      if (isArray(args)) {
        self.$apply.push({
          obj : obj,
          args: args
        });
      } else {
        self.$apply.push({
          obj: obj
        });
      }
    }

    return found;
  }

  function copyArgs(obj, args){
    for (var i = 0, len = args.length; i < len; i++) {
      obj.$arguments[i] = args[i];
    }
  }

  function splat(obj, key, args){
    if (args && args.length > 0) {
      switch (args.length) {
        case 1:
          return obj[key](args[0]);
        case 2:
          return obj[key](args[0], args[1]);
        case 3:
          return obj[key](args[0], args[1], args[2]);
        case 4:
          return obj[key](args[0], args[1], args[2], args[3]);
        case 5:
          return obj[key](args[0], args[1], args[2], args[3], args[4]);
        case 6:
          return obj[key](args[0], args[1], args[2], args[3], args[4], args[5]);
        default:
          return obj[key].apply(obj, args);
      }
    } else {
      return obj[key]();
    }
  }

  /*istanbul ignore next:placeholder*/
  function noop(){}

  /**
   * Base class that should define other classes
   *
   * @namespace ES5Class
   */
  /*istanbul ignore next:placeholder*/
  function ES5Class(){ }

  ES5Class.prototype.construct = noop;

  /**
   * Define a new class
   *
   * @param {String} className The name of the class
   * @param {(Object|Function)} [include] Your class prototype functions and variables or closure
   * @param {(Object|Function)} [implement] Your class static methods or closure
   *
   * @example
   *   var NewClass = ES5Class.$define('name', {
   *     construct: function(){
   *     }
   *   }, {
   *     static: 1
   *   });
   *   // If you use a function, you need to return an object
   *   var NewClass = ES5Class.$define('name', function(){
   *    // private variables
   *
   *    return {
   *      construct: function(){
   *      }
   *    };
   *   });
   *
   * @throws Error if you don't define a name for your class
   * @function $define
   * @memberof ES5Class
   * @returns {ES5Class} Your class definition
   */
  Object.defineProperty(ES5Class, '$define', {
    value: function $define(className, include, implement){
      var
        self = this, isClass, getClass;

      if (!className) {
        throw new Error('Class name must be specified');
      }

      function Constructor(){
        var args = BetterCurry.flatten(arguments);

        if (!(this instanceof Constructor)) {
          // auto instantiation
          return splat(Constructor, '$create', args);
        }

        if (superApply(this, Constructor, args)) {
          spo(this, Constructor.prototype); // always need to restore prototype after superApply
        }

        // old school new operator, call the constructor
        if (this.construct && this.construct !== noop) {
          splat(this, 'construct', args);
          copyArgs(this, args);
        }

        return this;
      }

      spo(Constructor, self);

      getClass = (function (Class){
        return function getClass(){
          return Class;
        };
      })(Constructor);

      isClass = (function (object){
        return function isClass(cls){
          return cls && isES5Class(cls) &&
          cls.constructor === object.constructor;
        };
      })(Constructor);

      Object.defineProperties(Constructor, {
        /**
         * The current class name
         *
         * @member {String} $className
         * @memberof ES5Class
         * @static
         */
        '$className' : {
          get: (function (className){
            return function $className(){
              return className;
            };
          })(className)
        },
        /**
         * The class definition itself
         *
         * @member {ES5Class} constructor
         * @memberof ES5Class
         * @static
         */
        'constructor': {
          get: getClass
        },
        /**
         * The parent class. This is always defined and defaults
         * to ES5Class if not derived from any other class.
         *
         * @memberof ES5Class
         * @member {ES5Class} $parent
         * @static
         */
        '$parent'    : {
          value: (function (object){
            return object;
          })(self)
        },
        /**
         * The current mixin objects and function that should be applied
         * to this class upon instantiation
         *
         * @member {Array.<Object>} $apply
         * @memberof ES5Class
         * @api protected
         * @static
         */
        '$apply'     : {
          value   : [],
          writable: true
        },
        /**
         * Array containing mixin'd classes, objects and functions
         *
         * @member {Array.<(ES5Class|Object|Function)>} $implements
         * @memberof ES5Class
         * @api protected
         * @static
         */
        '$implements': {
          value   : [],
          writable: true
        },
        /**
         * Check if the current class definition is the param
         *
         * @function $isClass
         * @param {Object} cls Any class
         *
         * @memberof ES5Class
         * @static
         *
         * @returns {Boolean} Whether is the given class or not
         */
        '$isClass'   : {
          value: isClass
        },
        /**
         * @member {ES5Class} $class
         * @memberof ES5Class
         * @static
         */
        '$class'     : {
          get: getClass
        },
        'prototype'  : {
          value: (function (prototype){
            return prototype;
          })(Object.create(self.prototype, {
          /**
           * @member {ES5Class} $class
           * @memberof ES5Class
           * @instance
           */
            constructor  : {
              get: getClass
            },
            /**
             * @memberof ES5Class
             * @member {Array} $implements
             * @see ES5Class.$implements
             * @instance
             */
            '$implements': {
              'get': (function (object){
                return function $implements(){
                  return object.$implements;
                };
              })(Constructor)
            },
            /**
             * @memberof ES5Class
             * @member {String} $className
             * @see ES5Class.$className
             * @instance
             */
            '$className': {
              'get': (function (object){
                return function $className(){
                  return object.$className;
                };
              })(Constructor)
            },
            /**
             * The arguments that instantiated this class
             *
             * @example
             *   var YourClass = ES5Class.$define('YourClass');
             *   YourClass.$create(1,2,{'3': 4}).$arguments // [1,2,{'3':4}]
             *
             * @memberof ES5Class
             * @member {Array} $arguments
             * @instance
             */
            '$arguments' : {
              value   : [],
              writable: true
            },
            /**
             * The parent prototype
             *
             * @memberof ES5Class
             * @member {ES5Class} $parent
             * @instance
             */
            '$parent'    : {
              value: (function (object){
                return object;
              })(self.prototype)
            },
            /**
             * The constructor of this class
             *
             * @memberof ES5Class
             * @member {ES5Class} $class
             * @instance
             */
            '$class'     : {
              'get': getClass
            },
            /**
             * @param {Object} cls
             * @function $isClass
             * @memberof ES5Class
             *
             * @returns {Boolean} If the current is the given param
             */
            '$isClass'   : {
              value: isClass
            }
          }))
        }
      });

      if (implement) {
        Constructor.$implement(implement);
      }

      if (include) {
        Constructor.$include(include);
      }

      return Constructor;
    }
  });

  /**
   * Create a new instance of your class. It returns the instance, so
   * you can chain methods.
   *
   * @example
   *   var YourDefinedClass = ES5Class.$define('YourDefinedClass', {
   *     instanceMethod: function(){}
   *   });
   *   YourDefinedClass.$create('some', 'arguments').instanceMethod();
   *
   * @param {...*} [...] Any parameters
   * @function $create
   * @memberof ES5Class
   * @static
   * @returns {ES5Class} The instance of your class
   */
  Object.defineProperty(ES5Class, '$create', {
    value: function $create(){
      var
        self = this,
        instance = self.$apply.length ? Object.create(null) : Object.create(self.prototype),
        args = BetterCurry.flatten(arguments);


      if (superApply(instance, self, args)){
        spo(instance, self.prototype); // always need to restore prototype after superApply
      }

      if (instance.construct && instance.construct !== noop) {
        splat(instance, 'construct', args);
        copyArgs(instance, args);
      }

      return instance;
    }
  });

  /**
   * Add, override or overload prototype methods of the class
   *
   * @param {(Object|Function)} obj The definition object or closure
   * @function $include
   * @memberof ES5Class
   * @static
   * @return {ES5Class} Returns itself so it can be chained
   */
  Object.defineProperty(ES5Class, '$include', {
    value: function $include(obj){
      var self = this, wrap, newfunc, descriptor;

      if (obj !== undefined && obj !== null && self.prototype !== undefined) {
        if (isArray(obj)) {
          for (var i = 0, len = obj.length; i < len; i++) {
            // An array of either a function, ES5Class or plain objects
            self.$include(obj[i]);
          }
        } else if (
          isPlainFunction(obj)
        ) {
          if ((newfunc = obj.call(self, self.$parent.prototype)) &&
              (isObject(newfunc) || isArray(newfunc))) {
            // Include the result of the closure if it's not null/undefined
            self.$include(newfunc);
          }
        } else {
          for (var key in obj) {
            if (hwp.call(obj, key)) {
              descriptor = gpd(obj, key);
              if (
                    descriptor !== undefined && (
                    configurables[key] !== undefined ||
                    descriptor.set !== undefined ||
                    descriptor.get !== undefined ||
                    descriptor.writable === false ||
                    descriptor.configurable === false ||
                    descriptor.enumerable === false
                  )
                ) {
                Object.defineProperty(self.prototype, key, descriptor);
              } else if (key !== 'prototype') {
                if (isFunction(obj[key])) {
                  // Wrap function for $super
                  wrap = functionWrapper(key, obj, (isFunction(self.prototype[key]) ? self.prototype[key] : noop), self.prototype);

                  self.prototype[key] = wrap;
                } else {
                  // Not a function, copy it over
                  self.prototype[key] = obj[key];
                }
              }
            }
          }
        }
      }

      return self;
    }
  });

  /**
   * Add, override or overload static methods to the class
   *
   * @param {(Object|Function)} obj The definition object or closure
   * @param {Boolean} apply When implementing other classes, you can automatically apply their constructors by passing true to this parameter
   * @param {Boolean} importing Is being called from an instantiated class, the mixin is made per instance and not globally
   * @param {Boolean} both Should import both prototype and properties
   *
   * @function $implement
   * @memberof ES5Class
   * @returns {ES5Class} Returns itself so it can be chained
   */
  Object.defineProperty(ES5Class, '$implement', {
    value: function $implement(obj, apply, importing){
      var self = this, func, newfunc, descriptor;

      if (obj !== undefined && obj !== null) {
        if (isArray(obj)) {
          // Classes/objects should be mixed in
          for (var i = 0, len = obj.length; i < len; i++) {
            if (importing) {
              ES5Class.$implement.call(self, obj[i], apply, importing);
            } else {
              self.$implement(obj[i], apply, importing);
            }
          }
        } else if (
          isPlainFunction(obj)
        ) {
          if ((newfunc = obj.call(self, self.$parent)) &&
              (isObject(newfunc) || isArray(newfunc))) {
            // Class should implement the closure result only
            // if the function returns something
            if (importing){
              ES5Class.$implement.call(self, newfunc, apply, importing);
            } else {
              self.$implement(newfunc, apply, importing);
            }
          }
        } else {
          if (
            isES5Class(obj) && self.$implements.indexOf(obj) === -1
          ) {
            // Keep track of mixin'd classes
            self.$implements.push(obj);
          }

          for (var key in obj) {
            if (key !== 'prototype') {
              descriptor = gpd(obj, key);
              if (descriptor !== undefined && (
                  descriptor.set !== undefined ||
                  descriptor.get !== undefined ||
                  descriptor.writable === false ||
                  descriptor.configurable === false ||
                  descriptor.enumerable === false
                )
              ) {
                Object.defineProperty(self, key, descriptor);
              } else {
                if (isFunction(obj[key])) {
                  // Wrap the function for $super usage
                  func = functionWrapper(key, obj, (isFunction(self[key]) ? self[key] : noop), self);

                  self[key] = func;
                } else {
                  // Not a function, just copy the value
                  self[key] = obj[key];
                }
              }
            }
          }

          if (obj.prototype !== undefined && !importing) {
            if (apply) {
              applyArray(self, obj);
            }
            // Current object has a prototype (be it a ES5Class or not), let's
            // include them in our class definition
            self.$include(obj.prototype);
          } else if (importing) {
            ES5Class.$include.call(self, obj.prototype || obj);
          }
        }
      }

      return self;
    }
  });

  /**
   * Define enumerable but read only methods or fields
   *
   * @example
   *   var MyClass = ES5Class.$define('MyClass');
   *   MyClass.$const({
   *     myValue: 1
   *   });
   *   MyClass.myValue = 0; // MyClass.myValue is still 1
   *   //throws Error if in strict mode
   *
   * @memberof ES5Class
   * @function $const
   *
   * @param {(Function|Object)} values Object containing the key: values, or a function that returns an object
   * @param {Boolean} toPrototype Append to this class prototype instead
   * @static
   *
   * @returns {ES5Class} Return itself so it can be chained
   */
  Object.defineProperty(ES5Class, '$const', {
    value: function $const(values, toPrototype) {
      var target = this;
      if (toPrototype === true) {
        target = this.prototype;
      }

      if (isPlainFunction(values)){
        values = values.call(this);
        if (isObject(values)) {
          this.$const(values, toPrototype);
        }
      } else if (isObject(values)) {
        for (var i in values) {
          Object.defineProperty(target, i, {
            value: values[i],
            enumerable: true
          });
        }
      }

      return this;
    }
  });

  /**
   * Ensure the given param is an ES5Class before trying to call any ES5Class
   * specific functions.
   *
   * @example
   *   var MyClass = {'doh': true};
   *   ES5Class.$isES5Class(MyClass); // false
   *   ES5Class.$isES5Class(ES5Class.$wrap(MyClass)); // true, named Wrapped
   *   ES5Class.$isES5Class(ES5Class.$wrap(MyClass, 'MyClass')); // true, named MyClass
   *
   * @function $wrap
   * @memberof ES5Class
   * @param {*} obj Object to wrap as a function
   * @param {String} [name] Name of the object if it's not already an {@link ES5Class}
   * @static
   *
   * @returns {ES5Class} Always return a class, even an empty one
   */
  Object.defineProperty(ES5Class, '$wrap', {
    value: function $wrap(obj, name){
      return isES5Class(obj) ? obj : ES5Class.$define(name || 'Wrapped', obj);
    }
  });

  /**
   * Inherits from an existing class, apply the constructor automatically
   *
   * @example
   *   var MyEventEmitter = ES5Class.$define('MyEventEmitter');
   *   MyEventEmitter.$inherit(require('events').EventEmitter, []);
   *
   * @param {(Function|Object)} from The class / object to inherit from
   * @param {Array} args Arguments when this super constructor is called. If you leave it undefined,
   * it will apply the arguments you pass to the $create function. If you pass in an empty array, the
   * super constructor will be called with no arguments.
   *
   * @function $inherit
   * @memberof ES5Class
   * @static
   * @returns {ES5Class}
   */
  Object.defineProperty(ES5Class, '$inherit', {
    value: function $inherit(from, args){
      applyArray(this, from, args && args.length ? BetterCurry.flatten(args) : undefined);

      this.$implement(from);

      return this;
    }
  });

  /**
   * Check if the argument is a ES5Class
   *
   * @param {(Function|Object)} cls Object or function to check if is an {@link ES5Class}
   * @function $isES5Class
   * @memberof ES5Class
   * @static
   *
   * @returns {Boolean} Given parameter is an ES5Class?
   */
  Object.defineProperty(ES5Class, '$isES5Class', {
    value: isES5Class
  });

  /**
   * Current version
   *
   * @property {String} $version
   * @memberof ES5Class
   * @static
   */
  Object.defineProperty(ES5Class, '$version', {
    value: '2.3.1'
  });

  /**
   * Get the current class name.
   *
   * Gets overwritten in {@link ES5Class.$define}
   *
   * @member {String} $className
   * @memberof ES5Class
   * @static
   */
  Object.defineProperty(ES5Class, '$className', {
    get: function $className(){
      return 'ES5Class';
    }
  });

  /**
   * Get the current class definition created with {@link ES5Class.$define}
   *
   * @member {ES5Class} $class
   * @memberof ES5Class
   * @instance
   */
  Object.defineProperty(ES5Class.prototype, '$class', {
    get: function $class(){
      return ES5Class;
    }
  });

  /**
   * Cleanup any variables that might hold external objects on the current instance before getting rid of it
   *
   * @function $destroy
   * @memberof ES5Class
   * @instance
   * @returns {ES5Class} Returns itself, so it can be chained
   */
  Object.defineProperty(ES5Class.prototype, '$destroy', {
    value       : function $destroy(){
      var self = this, k;

      if (self.$arguments && self.$arguments.length > 0) {
        while (self.$arguments.length > 0) {
          self.$arguments.pop();
        }
      }

      for (k in self) {
        delete self[k];
      }

      return this;
    },
    configurable: true
  });

  /**
   * Exchanges current proto for something else.
   * The original prototype chain is lost.
   *
   * This is an expensive operation and shouldn't be
   * used in performance critical parts
   * of the application.
   *
   * @example
   *   var MyClass = ES5Class.$define('MyClass', {
   *    that: function(){}
   *   });
   *   MyClass.$create().$exchange(require('http').Server); // MyClass is now an instanceof Server
   *
   * @param {(Object|Function)} obj Object that has a prototype to exchange to
   * @param {Array} params Params for calling the original constructor
   *
   * @function $exchange
   * @memberof ES5Class
   * @instance
   *
   * @returns {ES5Class} Returns itself so it can be chained
   */
  Object.defineProperty(ES5Class.prototype, '$exchange', {
    value: function $exchange(obj, args){
      if ((isFunction(obj) || isObject(obj)) && obj.prototype !== undefined) {
        var _args = this.$arguments;

        spo(this, obj.prototype);

        obj.apply(this, args || _args);
      }

      return this;
    }
  });

  /**
   * Shortcut for Object.getOwnPropertyNames(this)
   *
   * @example
   *   var YourClass = ES5Class.$define('YourClass',{ protoName: true });
   *   YourClass.$create().$names; // ['protoName']
   *
   * @member {Array} $names
   * @memberof ES5Class
   * @instance
   *
   */
  Object.defineProperty(ES5Class.prototype, '$names', {
    get: function $names(){
      var names = Object.getOwnPropertyNames(this);

      return names.filter(function (i){
        return filtered[i] === undefined;
      });
    }
  });

  /**
   * Imports another object (both static and prototype methods)
   * to the current instance. It mixin other objects on the current instance and
   * execute their functions in this class context.
   *
   * This is an expensive operation and shouldn't be
   * used in performance critical parts
   * of the application
   *
   * @example
   *   var YourClass = ES5Class.$define('YourClass');
   *   var instance = new YourClass();
   *   instance.$import(Error); // make your instance act like if it was an Error
   *
   * @param {(Function|Object)} obj Pass an object or a function that has a prototype or members
   * @function $import
   * @memberof ES5Class
   * @instance
   *
   * @returns {ES5Class} Returns itself so it can be chained
   */
  Object.defineProperty(ES5Class.prototype, '$import', {
    value: function $import(obj){
      ES5Class.$implement.call(this, obj, null, true);

      return this;
    }
  });

  /**
   * Delegates a function or getter/setter to the constructor static method or to a member of the current instance
   *
   * This is an expensive operation and shouldn't be used in performance critical parts
   * of the application. Instead, you should inherit from a deriving class if you need
   * performance.
   *
   * @example
   *   // by default, you create a delegate from the static members of the class
   *   var YourClass = ES5Class.$define('YourClass', {}, {
   *     someFunction: function(){
   *     },
   *     someStaticObject: {}
   *   });
   *   var instance = YourClass.$create();
   *   instance.$delegate().access('someStaticObject').method('someFunction');
   *
   *   instance.someFunction(); // calls the YourClass.someFunction like if it belong to the prototype
   *
   *   // but you can create it from another member of the current instance
   *   YourClass.$include({
   *     someData: {
   *      subdata: {
   *        //...
   *      }
   *     }
   *   });
   *   instance = YourClass.$create();
   *   instance.$delegate('someData').access('subdata');
   *   instance.subdata.addMember = true; // instance.someData.subdata.addMember === true
   *   //instance.subdata is now a read/write access to the original someData.subdata
   *
   * @param {String} [where] Where to delegate, any member of the current instance or defaults to $class
   * @function $delegate
   * @memberof ES5Class
   * @instance
   *
   * @returns {BetterCurry.delegate} An instance of {@link https://github.com/pocesar/js-bettercurry#bettercurrydelegateproto-target BetterCurry.delegate}
   */
  Object.defineProperty(ES5Class.prototype, '$delegate', {
    value: function $delegate(where){
      return new BetterCurry.delegate(this, where || '$class');
    }
  });

  /**
   * Returns true if the current instance is an instance of the class
   * definition passed parameter. It goes beyond strict `isPrototypeOf` check,
   * it also check for mixin'd classes (through {@link ES5Class.$implement} or
   * {@link ES5Class.$inherit}).
   *
   * @param {(Function|Object)} object You pass in either an object or function (that is a {@link ES5Class}) for checking
   * @function $instanceOf
   * @memberof ES5Class
   * @instance
   *
   * @returns {Boolean} Whether the current instance is instanceof the passed argument
   */
  Object.defineProperty(ES5Class.prototype, '$instanceOf', {
    value: function $instanceOf(object){
      var self = this;

      return object &&
      (
        (object.prototype && object.prototype.isPrototypeOf(self)) ||
        (self.isPrototypeOf(object)) ||
        applyArray(self.$class, object, null, true)
      );
    }
  });

  return ES5Class;
}));