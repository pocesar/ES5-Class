var
  Benchmark = require('Benchmark'),
  suite = new Benchmark.Suite,
  util = require('util'),
  Class = require('../es5class'),
  base = {
    'args'      : {'Class': Class},
    'onComplete': function (event){
      console.log(String(event.target));
    },
    'onError'   : function (event){
      console.log(String(event.message));
    }
  };

suite
  .add('class instance function call',
    util._extend({
        fn   : function (){
          Cls.create().test();
        },
        setup: function (){
          var Cls = this.args.Class.extend('cls', {
            'test': function (){
              return true;
            }
          });
        }
      },
      base
    )
  )
  .add('class method function call',
    util._extend({
        setup: function (){
          var Cls = this.args.Class.extend('cls');
          Cls.implement({
            'test': function (){
              return true;
            }
          });
        },
        fn   : function (){
          Cls.test();
        }
      },
      base
    )
  )
  .add('class instance included function call',
    util._extend({
        setup: function (){
          var Cls = this.args.Class.extend('cls');
          Cls.include({
            'test': function (){
              return true;
            }
          });
        },
        fn   : function (){
          Cls.create().test();
        }
      },
      base
    )
  )
  .add('$super instance function calls',
    util._extend({
        setup: function (){
          var Cls = this.args.Class.extend('cls', {
            test: function (){
              return true;
            }
          });
          var Clss = Cls.extend('clss', {
            test: function (){
              return this.$super();
            }
          });
        },
        fn   : function (){
          Clss.create().test();
        }
      },
      base
    )
  )
  .add('$super class function calls',
    util._extend({
        setup: function (){
          var Cls = this.args.Class.extend('cls', {}, {
            test: function (){
              return true;
            }
          });

          Cls.implement({
            test: function (){
              return this.$super();
            }
          });
        },
        fn   : function (){
          Cls.test();
        }
      },
      base
    )
  )
  .add('$super inherited two levels deep function calls',
    util._extend({
        setup: function (){
          var Cls = this.args.Class.extend('cls', {}, {
            test: function (){
              return true;
            }
          });
          Cls.implement({
            test: function (){
              return this.$super();
            }
          });
          var Two = Cls.extend('Two', {}, {
            test: function (){
              return this.$super();
            }
          });
        },
        fn   : function (){
          Two.test();
        }
      },
      base
    )
  )
  .run();