/**
 * @version 0.6.0
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
        self = this, object;

      if (!className) {
        throw new Error('Class name must be specified');
      }

      object = Object.create(self, {
        '$className' : {
          get: (function (className){
            return function (){
              return className;
            };
          })(className)
        },
        '$parent'    : {
          value: (function (obj){
            return obj;
          })(self)
        },
        '$implements': {
          value   : [],
          writable: true
        },
        'prototype'  : {
          value: (function (obj){
            return Object.create(obj.prototype);
          })(self)
        }
      });

      Object.defineProperty(object.prototype, '$implements', {
        'get': (function (object){
          return function (){
            return object.$implements;
          };
        })(object)
      });

      Object.defineProperty(object.prototype, '$getClass', {
        configurable: true,
        value       : (function (Class){
          return function (){
            return Class;
          };
        })(object)
      });

      var isClass = (function (object){
        return function (cls){
          return cls && object &&
            cls.$className &&
            object.$className &&
            cls.$className === object.$className &&
            cls.prototype === object.prototype;
        };
      })(object);

      Object.defineProperty(object, '$isClass', {
        value: isClass
      });

      Object.defineProperty(object.prototype, '$isClass', {
        value: isClass
      });

      if (include) {
        object.include(include);
      }

      if (implement) {
        object.implement(implement);
      }

      return object;
    },
    create   : function (){
      var
        self = this,
        instance = Object.create(self.prototype);

      Object.defineProperty(instance, '$parent', {
        value: this.$parent.prototype
      });

      instance.construct.apply(instance, arguments);

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
          self.include(obj());
        } else {
          for (var key in obj) {
            if (_hwp.call(obj, key)) {
              if (_isFunction(obj[key])) {
                wrap = _functionWrapper(key, obj, _isFunction(self.prototype[key]) ? self.prototype[key] : _noop);
                
                Object.defineProperty(self.prototype, key, {
                  configurable: true,
                  enumerable  : true,
                  value       : wrap
                });
              } else {
                Object.defineProperty(self.prototype, key, {
                  enumerable: true,
                  writable  : true,
                  value     : obj[key]
                });
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
        self.implement(obj());
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

                Object.defineProperty(self, key, {
                  configurable: true,
                  enumerable  : true,
                  value       : func
                });
              } else {
                Object.defineProperty(self, key, {
                  enumerable  : true,
                  writable    : true,
                  configurable: true,
                  value       : obj[key]
                });
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

Object.defineProperty(ES5Class.prototype, '$getClass', {
  value: function (){
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
