/**
 * @version 0.1.3
 */
var
  hwp = Object.prototype.hasOwnProperty,
  Class = {
    prototype: {
      init: function (){}
    },
    extend   : function (className, include, implement){
      var object = Object.create(this);

      Object.defineProperty(object, 'parent', {
        value: this
      });

      Object.defineProperty(object, 'prototype', {
        value: Object.create(this.prototype)
      });

      if (!className) {
        throw new Error("Class name must be specified");
      }

      Object.defineProperty(object, "className", {
        get: function (){
          return className;
        }
      });

      Object.defineProperty(object.prototype, "getClass", {
        value: (function (parentClass){
          return function (){
            return parentClass;
          };
        })(object)
      });

      /*
       var isStrictSupported = (function () { "use strict"; return !this; })();
       console.log("Strict Supported: " + isStrictSupported);
       */

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

      Object.defineProperty(instance, 'parent', {
        value: this.parent.prototype
      });

      instance.init.apply(instance, arguments);
      return instance;
    },
    include  : function (obj){
      function functionWrapper(key, obj){
        return function (){
          var originalSuper = this._super;
          this._super = this.parent[key];
          var ret = obj[key].apply(this, arguments);
          this._super = originalSuper;
          return ret;
        };
      }

      for (var key in obj) {
        if (hwp.call(obj, key)) {
          if (typeof obj[key] === "function") {
            this.prototype[key] = functionWrapper(key, obj);
          }
          else {
            this.prototype[key] = obj[key];
          }
        }
      }

      return this;
    },
    implement: function (obj){
      for (var key in obj) {
        if (hwp.call(obj, key)) {
          if (key === "prototype") {
            this.include(obj[key]);
          }
          else {
            this[key] = obj[key];
          }
        }
      }

      return this;
    }
  };

Object.defineProperty(Class, "className", {
  get: function (){
    return "Class";
  }
});

Object.defineProperty(Class.prototype, "getClass", {
  value: function (){
    return Class;
  }
});

Object.defineProperty(Class.prototype, "instanceOf", {
  value: function (object){
    return object.prototype.isPrototypeOf(this);
  }
});

module.exports = Class;
