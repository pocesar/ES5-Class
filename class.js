/**
 * @version 0.2.0
 */
var
  hwp = Object.prototype.hasOwnProperty,
  isArray = function (obj){
    return obj && Object.prototype.toString.call(obj) === '[object Array]';
  },
  Class = {
    prototype: {
      construct: function (){}
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
        throw new Error("Class name must be specified");
      }

      Object.defineProperty(object, "$className", {
        get: (function (className){
          return function (){
            return className;
          };
        })(className)
      });

      Object.defineProperty(object.prototype, "$getClass", {
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
      
      Object.defineProperty(object, "$isClass", {
        value       : isClass
      });
      
      Object.defineProperty(object.prototype, "$isClass", {
        value       : isClass
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
      function functionWrapper(key, obj){
        return function (){
          var originalSuper = this.$super;
          this.$super = this.$parent[key];
          var ret = obj[key].apply(this, arguments);
          this.$super = originalSuper;
          return ret;
        };
      }

      if (typeof obj !== 'undefined') {
        if (isArray(obj)) {
          for (var i = 0, len = obj.length; i < len; i++) {
            this.include(obj[i]);
          }
        } else if (typeof obj === 'function') {
          this.include(obj());
        } else {
          for (var key in obj) {
            if (hwp.call(obj, key)) {
              if (typeof obj[key] === "function") {
                Object.defineProperty(this.prototype, key, {
                  configurable: true,
                  enumerable  : true,
                  value       : functionWrapper(key, obj)
                });
              } else {
                Object.defineProperty(this.prototype, key, {
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
      if (isArray(obj)) {
        for (var i = 0, len = obj.length; i < len; i++) {
          this.implement(obj[i]);
        }
      } else if (typeof obj === 'function') {
        this.implement(obj());
      } else {
        if (obj.$isClass && obj.$implements) {
          this.$implements.push(obj);
        }
        
        for (var key in obj) {
          if (hwp.call(obj, key)) {
            if (key === "prototype") {
              this.include(obj[key]);
            } else {
              Object.defineProperty(this, key, {
                enumerable: true,
                writable  : true,
                configurable: true,
                value     : obj[key]
              });
            }
          }
        }
      }

      return this;
    }
  };

Object.defineProperty(Class, "$className", {
  get: function (){
    return "Class";
  }
});

Object.defineProperty(Class.prototype, "$getClass", {
  value: function (){
    return Class;
  }
});

Object.defineProperty(Class.prototype, "$instanceOf", {
  configurable: true,
  value       : function (object){
    return object && object.prototype && object.prototype.isPrototypeOf ? object.prototype.isPrototypeOf(this) : false;
  }
});

module.exports = Class;
