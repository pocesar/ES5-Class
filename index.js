/**
 * @version 0.6.1
 */

var
  _hwp = Object.prototype.hasOwnProperty,
  _noop = function (){},
  _isArray = function (obj){
    return obj && Object.prototype.toString.call(obj) === '[object Array]';
  },
  _isFunction = function (obj){
    return obj && (typeof obj === 'function');
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

      originalSuper = self.$super;

      // if we have an original, it's a Class method call, otherwise, let's look for the parent
      self.$super = original || self.$parent[key] || _noop;
      ret = obj[key].apply(self, arguments);

      self.$super = originalSuper; // restore the upper $super

      return ret;
    };
  },
  ES5Class = {
    prototype: {
      construct: _noop
    },
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
    create   : function (){
      var
        self = this,
        instance = Object.create(self.prototype);

      instance.$parent = this.$parent.prototype;

      if (instance.construct !== _noop) {
        instance.construct.apply(instance, arguments);
      }

      return instance;
    },
    include  : function (obj){
      var self = this, wrap;

      if (typeof obj !== 'undefined') {
        if (_isArray(obj)) {
          for (var i = 0, len = obj.length; i < len; i++) {
            self.include(obj[i]);
          }
        } else if (_isFunction(obj)) {
          self.include(obj.call(self, self.$parent.prototype));
        } else {
          for (var key in obj) {
            if (_hwp.call(obj, key)) {
              if (_isFunction(obj[key])) {
                wrap = _functionWrapper(key, obj, _isFunction(self.prototype[key]) ? self.prototype[key] : _noop);

                self.prototype[key] = wrap;
              } else {
                self.prototype[key] = obj[key];
              }
            }
          }
        }
      }

      return self;
    },
    implement: function (obj){
      var self = this, func;

      if (_isArray(obj)) {
        for (var i = 0, len = obj.length; i < len; i++) {
          self.implement(obj[i]);
        }
      } else if (_isFunction(obj)) {
        self.implement(obj.call(self, self.$parent));
      } else {
        if (obj.$isClass && obj.$implements) {
          self.$implements.push(obj);
        }

        for (var key in obj) {
          if (_hwp.call(obj, key)) {
            if (key === 'prototype') {
              self.include(obj[key]);
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

      return this;
    }
  };

Object.defineProperty(ES5Class, '$className', {
  get: function (){
    return 'ES5Class';
  }
});

Object.defineProperty(ES5Class.prototype, '$class', {
  get: function (){
    return ES5Class;
  }
});

Object.defineProperty(ES5Class.prototype, '$instanceOf', {
  value: function (object){
    return object && object.prototype && object.prototype.isPrototypeOf ? object.prototype.isPrototypeOf(this) : false;
  }
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ES5Class;
}
