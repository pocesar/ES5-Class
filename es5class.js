/**
 * @version 0.3.4
 */
var
  hwp = Object.prototype.hasOwnProperty,
  noop = function(){},
  isArray = function (obj){
    return obj && Object.prototype.toString.call(obj) === '[object Array]';
  },
  isFunction = function(obj){
    return obj && (typeof obj === 'function');
  },
  functionWrapper = function (key, obj, type, original){
    return function (){
      var originalSuper, ret = void 0;
      /* 
       * obj[key] = the calling function
       * this = this closure
       */
      switch (type) {
        case IMPLEMENT:
          originalSuper = this.$super; 
          this.$super = original;
          ret = obj[key].apply(this, arguments);
          this.$super = originalSuper;
          break;
        case INCLUDE:
          originalSuper = this.$super;
          this.$super = this.$parent[key];
          ret = obj[key].apply(this, arguments);
          this.$super = originalSuper;
          break;
      }
      return ret;
    };
  },
  IMPLEMENT = 'implement',
  INCLUDE = 'include',
  Class = {
    prototype: {
      construct: noop
    },
    extend   : function (className, include, implement){
      var object = Object.create(this);

      Object.defineProperties(object, {
        '$parent'    : {
          value: this
        },
        'prototype'  : {
          value: Object.create(this.prototype)
        },
        '$implements': {
          value     : [],
          enumerable: false,
          writable  : true
        }
      });

      Object.defineProperty(object.prototype, '$implements', {
        'get': (function (object){
          return function (){
            return object.$implements;
          };
        })(object)
      });

      if (!className) {
        throw new Error('Class name must be specified');
      }

      Object.defineProperty(object, '$className', {
        get: (function (className){
          return function (){
            return className;
          };
        })(className)
      });

      Object.defineProperty(object.prototype, '$getClass', {
        value: (function (Class){
          return function (){
            return Class;
          };
        })(object)
      });

      var isClass = (function (object){
        return function (cls){
          return cls && cls.$className &&
            object && object.$className &&
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
      var instance = Object.create(this.prototype);

      Object.defineProperty(instance, '$parent', {
        value: this.$parent.prototype
      });

      instance.construct.apply(instance, arguments);
      return instance;
    },
    include  : function (obj){
      var self = this;
      
      if (typeof obj !== 'undefined') {
        if (isArray(obj)) {
          for (var i = 0, len = obj.length; i < len; i++) {
            self.include(obj[i]);
          }
        } else if (isFunction(obj)) {
          self.include(obj());
        } else {
          for (var key in obj) {
            if (hwp.call(obj, key)) {
              if (isFunction(obj[key])) {
                Object.defineProperty(self.prototype, key, {
                  configurable: true,
                  enumerable  : true,
                  value       : functionWrapper(key, obj, INCLUDE)
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

      return this;
    },
    implement: function (obj){
      var self = this, func;
      
      if (isArray(obj)) {
        for (var i = 0, len = obj.length; i < len; i++) {
          self.implement(obj[i]);
        }
      } else if (isFunction(obj)) {
        self.implement(obj());
      } else {
        if (obj.$isClass && obj.$implements) {
          self.$implements.push(obj);
        }

        for (var key in obj) {
          if (hwp.call(obj, key)) {
            if (key === 'prototype') {
              self.include(obj[key]);
            } else {
              if (isFunction(obj[key])) {
                func = functionWrapper(key, obj, IMPLEMENT, isFunction(self[key]) ? self[key] : noop);
                
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
                  value     : obj[key]
                });
              }
            }
          }
        }
      }

      return this;
    }
  };

Object.defineProperty(Class, '$className', {
  get: function (){
    return 'Class';
  }
});

Object.defineProperty(Class.prototype, '$getClass', {
  value: function (){
    return Class;
  }
});

Object.defineProperty(Class.prototype, '$instanceOf', {
  configurable: true,
  value       : function (object){
    return object && object.prototype && object.prototype.isPrototypeOf ? object.prototype.isPrototypeOf(this) : false;
  }
});

module.exports = Class;
