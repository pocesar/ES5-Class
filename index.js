/**
 * @version 0.7.1
 */
'use strict';

var
  _hwp = Object.prototype.hasOwnProperty,
  _ts = Object.prototype.toString,
  _noop = function (){},
  _isArray = function (obj){
    return obj && _ts.call(obj) === '[object Array]';
  },
  _isFunction = function (object){
    return object && _ts.call(object) === '[object Function]';
  },
  _hasSuperRegex = /\$super/,
  _functionWrapper = function (key, obj, original){
    /*
     performance gain:
     476% on Class method calls
     40% on more than 1 level $super calls
     120% on instance and method $super calls
     42% on instance calls

     this function call happens only once when creating the class
     but the wrapper calls 2 functions instead of one
     so only wrap it when needed
     */

    if (!_hasSuperRegex.test(obj[key])) {
      return obj[key];
    }
    return function (){
      var originalSuper, ret, self = this;

      originalSuper = self.$super; // store current $super

      // if we have an original, it's a Class method call, otherwise, let's look for the parent, or use an empty function
      self.$super = original || self.$parent[key] || _noop;
      ret = obj[key].apply(self, arguments);

      self.$super = originalSuper; // restore the upper $super

      return ret;
    };
  },
  /**
   * Base class that should define other classes
   *
   * @constructor
   */
  ES5Class = {
    prototype: {
      /** @constructs ES5Class */
      construct: _noop
    },
    /**
     * Define a new class
     *
     * @param {String} className The name of the class
     * @param {Object|Function} [include] Your class prototype functions and variables or closure
     * @param {Object|Function} [implement] Your class static methods or closure
     *
     * @example
     * <pre>
     *   var NewClass = ES5Class.define('name', {
     *     construct: function(){
     *     }
     *   }, {
     *     static: 1
     *   });
     *   // If you use a function, you need to return an object
     *   var NewClass = ES5Class.define('name', function(){
     *    // private variables
     *
     *    return {
     *      construct: function(){
     *      }
     *    };
     *   });
     * </pre>
     *
     * @throws Error
     * @return ES5Class
     */
    define   : function (className, include, implement){
      var
        self = this, object, isClass, getClass;

      if (!className) {
        throw new Error('Class name must be specified');
      }

      object = Object.create(self);

      getClass = (function (Class){
        return function (){
          return Class;
        };
      })(object);

      isClass = (function (object){
        return function (cls){
          return cls && object &&
            cls.$className &&
            object.$className &&
            cls.$className === object.$className &&
            cls.prototype === object.prototype;
        };
      })(object);

      Object.defineProperties(object, {
        '$className' : {
          get: (function (className){
            return function (){
              return className;
            };
          })(className)
        },
        '$parent'    : {
          value: (function (object){
            return object;
          })(self)
        },
        '$implements': {
          value   : [],
          writable: true
        },
        '$isClass'   : {
          value: isClass
        },
        '$class'     : {
          get: getClass
        },
        'prototype'  : {
          value: (function (prototype){
            return prototype;
          })(Object.create(self.prototype))
        }
      });

      Object.defineProperties(object.prototype, {
        '$implements': {
          'get': (function (object){
            return function (){
              return object.$implements;
            };
          })(object)
        },
        '$class'     : {
          'get': getClass
        },
        '$isClass'   : {
          value: isClass
        }
      });

      if (implement) {
        object.implement(implement);
      }

      if (include) {
        object.include(include);
      }

      return object;
    },
    /**
     * Create a new instance of your class
     *
     * @instance
     * @return ES5Class
     */
    create   : function (){
      var
        self = this,
        instance = Object.create(self.prototype);

      instance.$parent = self.$parent.prototype;

      if (instance.construct !== _noop) {
        instance.construct.apply(instance, arguments);
      }

      return instance;
    },
    /**
     * Add, override or overload prototype methods of the class
     *
     * @param {Object|Function} obj The definition object or closure
     *
     * @return ES5Class
     */
    include  : function (obj){
      var self = this, wrap, newfunc;

      if (typeof obj !== 'undefined' && obj !== null) {
        if (_isArray(obj)) {
          for (var i = 0, len = obj.length; i < len; i++) {
            self.include(obj[i]);
          }
        } else if (_isFunction(obj) && (typeof (newfunc = obj.call(self, self.$parent.prototype)) !== 'undefined')) {
          self.include(newfunc);
        } else {
          for (var key in obj) {
            if (_hwp.call(obj, key)) {
              if (typeof obj[key] !== 'undefined') {
                if (typeof obj[key].$class !== 'undefined') {
                  self.include(obj[key]);
                } else if (_isFunction(obj[key])) {
                  wrap = _functionWrapper(key, obj, _isFunction(self.prototype[key]) ? self.prototype[key] : _noop);

                  self.prototype[key] = wrap;
                } else {
                  self.prototype[key] = obj[key];
                }
              }
            }
          }
        }
      }

      return self;
    },
    /**
     * Add, override or overload static methods to the class
     *
     * @param {Object|Function} obj The definition object or closure
     *
     * @return ES5Class
     */
    implement: function (obj){
      var self = this, func, newfunc;

      if (typeof obj !== 'undefined' && obj !== null) {
        if (_isArray(obj)) {
          for (var i = 0, len = obj.length; i < len; i++) {
            self.implement(obj[i]);
          }
        } else if (_isFunction(obj) && (typeof (newfunc = obj.call(self, self.$parent)) !== 'undefined')) {
          self.implement(newfunc);
        } else {
          if (typeof obj.$isClass !== 'undefined' && _isArray(obj.$implements)) {
            self.$implements.push(obj);
          }

          for (var key in obj) {
            if (_hwp.call(obj, key)) {
              if (typeof obj[key] !== 'undefined'){
                if (key !== 'prototype') {
                  if (typeof obj[key].$class !== 'undefined') {
                    self.implement(obj[key]);
                  } else {
                    if (_isFunction(obj[key])) {
                      func = _functionWrapper(key, obj, _isFunction(self[key]) ? self[key] : _noop);

                      self[key] = func;
                    } else {
                      self[key] = obj[key];
                    }
                  }
                }
              }
            }
          }

          if (obj.prototype) {
            self.include(obj.prototype);
          }
        }
      }

      return this;
    }
  };

/**
 * Get the current class name
 *
 * @typedef {String} $className
 */
Object.defineProperty(ES5Class, '$className', {
  get: function (){
    return 'ES5Class';
  }
});

/**
 * Get the current class definition created with ES5Class.define
 * Accessed by this.$class
 *
 * @typedef {Object} $class
 */
Object.defineProperty(ES5Class.prototype, '$class', {
  get: function (){
    return ES5Class;
  }
});

/**
 * Returns true if the current instance is an instance of the class
 * definition passed parameter
 *
 * @function $instanceOf
 */
Object.defineProperty(ES5Class.prototype, '$instanceOf', {
  value: function (object){
    return object && object.prototype && object.prototype.isPrototypeOf ? object.prototype.isPrototypeOf(this) : false;
  }
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ES5Class;
}
