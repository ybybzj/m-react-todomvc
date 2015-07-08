(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var router = require("page");
var Page = require(6);
var SF = require("s-flow");
var m = require("m-react");
var app = SF({
  state: require(8),
  signal: require(7),
  watch: require(9)
});

app.init();
m.mount(document.getElementById('todoapp'), m.component(Page, {sf:app}));
router('/:filter?', function(cxt){
  var filter = cxt.params.filter;
  filter = filter == null ? 'all': filter.trim() == '' ? 'all': filter.trim();
  app.signal.getEmitter('filterChanged')(filter);
});
router();
},{"6":6,"7":7,"8":8,"9":9,"m-react":"m-react","page":"page","s-flow":"s-flow"}],2:[function(require,module,exports){
var m = require("m-react");
var cx = require(10).classNames;
var Footer = m.createComponent({
  render: function(props){
    var activeTodoWord = props.count > 1 ? 'items' : 'item';
    var clearButton = null;

    if (props.completedCount > 0) {
      clearButton = (
        {tag: "button", attrs: {
          id:"clear-completed", 
          class:"clear-completed", 
          evClick:props.onClearCompleted}, children: [
          "Clear completed"
        ]}
      );
    }
    return (
        {tag: "footer", attrs: {id:"footer", class:"footer"}, children: [
          {tag: "span", attrs: {id:"todo-count", class:"todo-count"}, children: [
            {tag: "strong", attrs: {}, children: [props.count]}, " ", activeTodoWord, " left"
          ]}, 
          {tag: "ul", attrs: {id:"filters", class:"filters"}, children: [
            {tag: "li", attrs: {}, children: [
              {tag: "a", attrs: {
                href:"/", 
                className:cx({selected: props.filter === 'all'})}, children: [
                  "All"
              ]}
            ]}, 
            ' ', 
            {tag: "li", attrs: {}, children: [
              {tag: "a", attrs: {
                href:"/active", 
                className:cx({selected: props.filter === 'active'})}, children: [
                  "Active"
              ]}
            ]}, 
            ' ', 
            {tag: "li", attrs: {}, children: [
              {tag: "a", attrs: {
                href:"/completed", 
                className:cx({selected: props.filter === 'completed'})}, children: [
                  "Completed"
              ]}
            ]}
          ]}, 
          clearButton
        ]}
      );
  }
});

module.exports = Footer;
},{"10":10,"m-react":"m-react"}],3:[function(require,module,exports){
var m = require("m-react");
var ESCAPE_KEY = 27;
var ENTER_KEY = 13;
module.exports = m.createComponent({
  render: function(){
    return (
      {tag: "header", attrs: {id:"header", class:"header"}, children: [
        {tag: "h1", attrs: {}, children: ["todos"]}, 
        {tag: "input", attrs: {
          id:"new-todo", 
          class:"new-todo", 
          placeholder:"What needs to be done?", 
          evKeyDown:this.onHandleNewTodoKeyDown, 
          autoFocus:true}
        }
      ]}
    );
  },
  onHandleNewTodoKeyDown: function(e){
    var val = e.target.value.trim();
    if(event.which === ESCAPE_KEY){
      e.target.value = null;
    }else if(event.which === ENTER_KEY && val !== ''){
      if(this.props.onTodoCreated)
          this.props.onTodoCreated({val: val});
      e.target.value = null;
    }
  },
});
},{"m-react":"m-react"}],4:[function(require,module,exports){
var m = require("m-react");
var _ = require(10);
var ESCAPE_KEY = 27;
var ENTER_KEY = 13;
var TodoItem = m.createComponent({
    onHandleSubmit: function () {
      var val = this.state.editText.trim();
      if (val) {
        this.props.onSave({
          id: this.todoId, 
          value: val
        });
        this.setState({editText: val});
      } else {
        this.props.onDestroy({id: this.todoId});
      }
    },

    onHandleEdit: function () {
      this.props.onEdit({id: this.todoId});
      this.setState({editText: this.props.todo.title});
    },
    onToggle: function(e){
      this.props.onToggle({id: this.todoId});
    },
    onDestroy: function(){
      this.props.onDestroy({id: this.todoId});
    },
    onHandleKeyDown: function (event) {
      if (event.which === ESCAPE_KEY) {
        this.setState({editText: this.props.todo.title});
        this.props.onCancel({id: this.todoId});
      } else if (event.which === ENTER_KEY) {
        this.onHandleSubmit();
      }
    },

    onHandleChange: function (event) {
      this.setState({editText: event.target.value});
    },

    getInitialState: function () {
      return {editText: this.props.todo.title};
    },

    componentWillReceiveProps: function(props){
      this.todoId = props.todo.id;
      return props;
    },
    /**
     * This is a completely optional performance enhancement that you can
     * implement on any React component. If you were to delete this method
     * the app would still work correctly (and still be very performant!), we
     * just use it as an example of how little code it takes to get an order
     * of magnitude performance improvement.
     */
    shouldComponentUpdate: function (oldProps, oldState) {
      return (
        this.props.todo !== oldProps.todo ||
        this.state.editText !== oldState.editText
      );
    },

    /**
     * Safely manipulate the DOM after updating the state when invoking
     * `this.props.onEdit()` in the `handleEdit` method above.
     * For more info refer to notes at https://facebook.github.io/react/docs/component-api.html#setstate
     * and https://facebook.github.io/react/docs/component-specs.html#updating-componentdidupdate
     */
    componentDidUpdate: function (el, prevProps) {
      if (!prevProps.editing && this.props.editing) {
        var node = el.querySelector('.edit-field');
        node.focus();
        node.setSelectionRange(node.value.length, node.value.length);
      }
    },

    render: function (props) {
      var todo = props.todo;
      return (
        {tag: "li", attrs: {className:_.classNames({
          completed: todo.completed,
          editing: todo.status === 'editing'
        })}, children: [
          {tag: "div", attrs: {className:"view"}, children: [
            {tag: "input", attrs: {
              id:todo.id, 
              className:"toggle", 
              type:"checkbox", 
              checked:todo.completed, 
              evChange:this.onToggle}
            }, 
            {tag: "label", attrs: {ondblclick:this.onHandleEdit}, children: [
              todo.title
            ]}, 
            {tag: "button", attrs: {className:"destroy", onclick:this.onDestroy}}
          ]}, 
          {tag: "input", attrs: {
            ref:"editField", 
            className:"edit edit-field", 
            value:this.state.editText, 
            evBlur:this.onHandleSubmit, 
            evInput:this.onHandleChange, 
            evKeyDown:this.onHandleKeyDown}
          }
        ]}
      );
    }
});

module.exports = TodoItem;
},{"10":10,"m-react":"m-react"}],5:[function(require,module,exports){
var m = require("m-react");
var sfMixin = require(16);
function createPageComponent(options){
  options.mixins =  options.mixins || [];
  options.mixins = [].concat(options.mixins);
  options.mixins.push(sfMixin());
  return m.createComponent(options);
}
module.exports = createPageComponent;
},{"16":16,"m-react":"m-react"}],6:[function(require,module,exports){
var m = require("m-react");
var createPage = require(5);
var TodoItem = require(4);
var TodoFooter = require(2);
var TodoHeader = require(3);
var page = require("page");

var App = createPage({
  signals:[
    'filterChanged',
    'completedCleared',
    'allToggled',
    'todoToggled',
    'todoEdited',
    'todoDestroyed',
    'todoSaved',
    'todoCanceled',
    'todoCreated'
    ],
  facets:{
    shownTodos: 'showingTodos',
    activeTodoCount: 'activeTodoCount',
    completedCount: 'completedCount'
  },
  cursors:{
    filter: 'filter'
  },
  // getInitialState: function(){
  //   return {editText:''};
  // },
  render: function () {
    var footer;
    var main;
    var todos = this.state.todos;


    var todoItems = this.state.shownTodos.map(function (todo) {
      return (
        m.component(TodoItem, {
          key:todo.id, 
          todo:todo, 
          onToggle:this.signals.todoToggled, 
          onDestroy:this.signals.todoDestroyed, 
          onEdit:this.signals.todoEdited, 
          onSave:this.signals.todoSaved, 
          onCancel:this.signals.todoCanceled}
        )
      );
    }, this);


    if (this.state.activeTodoCount || this.state.completedCount) {
      footer =
        m.component(TodoFooter, {
          count:this.state.activeTodoCount, 
          completedCount:this.state.completedCount, 
          filter:this.state.filter, 
          onClearCompleted:this.signals.completedCleared}
        );
    }

    if (todoItems.length) {
      main = (
        {tag: "section", attrs: {id:"main", className:"main"}, children: [
          {tag: "input", attrs: {
            id:"toggle-all", 
            class:"toggle-all", 
            type:"checkbox", 
            evChange:this.onToggleAll, 
            checked:this.state.activeTodoCount === 0}
          }, 
          {tag: "ul", attrs: {id:"todo-list", class:"todo-list"}, children: [
            todoItems
          ]}
        ]}
      );
    }

    return (
      {tag: "div", attrs: {}, children: [
        m.component(TodoHeader, {
          onTodoCreated:this.signals.todoCreated}
        ), 
        main, 
        footer
      ]}
    );
  },
  
  onToggleAll: function(e){
    var completed = e.target.checked;
    this.signals.allToggled(!!completed);
  }
});
module.exports = App;
},{"2":2,"3":3,"4":4,"5":5,"m-react":"m-react","page":"page"}],7:[function(require,module,exports){
module.exports = function(signal){
  signal.add('filterChanged')
    .add('completedCleared')
    .add('allToggled')
    .add('todoToggled')
    .add('todoEdited')
    .add('todoDestroyed')
    .add('todoSaved')
    .add('todoCanceled')
    .add('todoCreated');
};
},{}],8:[function(require,module,exports){
module.exports = {
  data: {
    todos: {},
    index:[],
    filter: 'all'
  },
  facets: {
    showingTodos: {
      cursors: {
        todos: 'todos',
        index: 'index',
        filter: 'filter'
      },
      get: function(data) {
        return values(data.todos, data.index).filter(function(item) {
          switch (data.filter) {
            case 'active':
              return !item.completed;
            case 'completed':
              return item.completed;
            default:
              return true;
          }
        });
      }
    },
    completedCount: {
      cursors: {
        todos: 'todos',
        index: 'index'
      },
      get: function(data) {
        return values(data.todos, data.index).reduce(function(accum, todo) {
          return !todo.completed ? accum : accum + 1;
        }, 0);
      }
    },
    activeTodoCount: {
      cursors: {
        todos: 'todos',
        index: 'index'
      },
      get: function(data) {
        return values(data.todos, data.index).reduce(function(accum, todo) {
          return todo.completed ? accum : accum + 1;
        }, 0);
      }
    }
  },
  refs:{
    todos: 'todos'
  },
  options: {
    syncwrite: true
  }
};

function values(obj, index){
  var result = [];
  for(var i= 0, l = index.length; i < l; i++){
    result.push(obj[index[i]]);
  }
  return result;
}
},{}],9:[function(require,module,exports){
var curry = require(11);
module.exports = function(watch){
  watch('todoToggled', _updateTodo({
    completed: function(c){return !c;},
  }));
  watch('todoEdited', _updateTodo({
    status:'editing'
  }));
  watch('todoDestroyed', onTodoDestroyed);
  watch('todoSaved', _updateTodo(function(data){
    return {
      title: data.value,
      status: 'saved'
    };
  }));
  watch('todoCanceled', _updateTodo({
    status: 'saved'
  }));
  watch('todoCreated', onTodoCreated);
  watch('filterChanged', onFilterChanged);
  watch('completedCleared', _updateTodos({
    completed: false
  }));
  watch('allToggled', _updateTodos(function(completed){
    return {
      completed: completed
    };
  }));
};

//updates

function onTodoDestroyed(store, refs, data){
  var ref = refs.todos.get(data.id),
      indexes = store.get('index');
  refs.todos.remove(ref);
  store.unset(['todos', ref]);
  store.splice('index', [indexes.indexOf(ref), 1]);
}

function onTodoCreated(store, refs, data){
  var newTodo = {
    title: data.val,
    status: 'created'
  };
  var newRef =  refs.todos.create(),
      newId = newRef;
  refs.todos.update(newRef, newId);
  newTodo.id = newId;
  store.set(['todos', newRef], newTodo);
  store.unshift('index', newRef);
}

function onFilterChanged(store, _, filter){
  store.set('filter', filter);
}

//helpers
var _updateTodo = curry(3, function _updateTodo(update, store, refs, data){
  var ref = refs.todos.get(data.id),
      cursor = store.select('todos');
  if(typeof update === 'function'){
    update = update(data);
  }
  Object.keys(update).forEach(function(k){
    var val = update[k];
    if(typeof val === 'function'){
      val = val(cursor.get([ref,k]));
    }
    cursor.set([ref, k], val);
  });
});

var _updateTodos = curry(3, function _updateTodos(update, store, _, data){
  var index = store.get('index'),
      cursor = store.select('todos');
  if(typeof update === 'function'){
    update = update(data);
  }
  index.forEach(function(ref){
    cursor.merge(ref, update);
  });
});
},{"11":11}],10:[function(require,module,exports){
function classNames(classes) {
  var cs = '';
  for (var i in classes) {
    cs += (classes[i]) ? i + ' ' : '';
  }
  return cs.trim();
}
module.exports = {
  classNames: classNames
};
},{}],11:[function(require,module,exports){
var __ = require(12);
var slice = require(13);

function curry(arity, fn) {
  switch (arguments.length) {
    case 0:
      return function(fn) {
        return curry(fn);
      };
    case 1:
      if (typeof arity === 'function') {
        return curry(-1, arity);
      } else {
        return function(fn) {
          return curry(arity, fn);
        }
      }
  }
  if (typeof arity !== 'number') {
    throw new TypeError('[curry] first argument should be a number! given: ' + arity);
  }
  if (typeof fn !== 'function') {
    throw new TypeError('[curry] second argument should be a function! given: ' + fn);
  }
  arity = arity > -1 ? arity : fn.length;
  if(arity === 0) return fn;
  return function curried() {
    var n = arguments.length;
    var shortfall = arity - n;
    var idx = n;
    while (--idx >= 0) {
      if (arguments[idx] === __) {
        shortfall += 1;
      }
    }
    if (shortfall <= 0) {
      return fn.apply(this, arguments);
    } else {
      var initialArgs = slice(arguments);
      return curry(shortfall, function() {
        var currentArgs = slice(arguments);
        var combinedArgs = [];
        var idx = -1;
        while (++idx < n) {
          var val = initialArgs[idx];
          combinedArgs[idx] = val === __ ? currentArgs.shift() : val;
        }
        return fn.apply(this, combinedArgs.concat(currentArgs));
      });
    }
  };
}
module.exports = curry;
//test 
// if(require.main === module){
//   var fn = function(a, b){ return a + b;};
//   var curried = curry(2,fn)(3);
//   console.log(curried(2,3,6,9));
// }
},{"12":12,"13":13}],12:[function(require,module,exports){
module.exports = Object.create(null);
},{}],13:[function(require,module,exports){
//brorrowed from lamda$_slice
module.exports = function slice(args, from, to){
  switch(arguments.length){
    case 1: return slice(args, 0, args.length);
    case 2: return slice(args, from, args.length);
    default:
      var list = [];
      var idx = -1;
      var len = Math.max(0, Math.min(args.length, to) - from);
      while(++idx < len){
        list[idx] = args[from + idx];
      }
      return list;
  }
};
},{}],14:[function(require,module,exports){
var shadowEqual = require(15);
module.exports = function() {
  return {
    shouldComponentUpdate: function(oldProps, oldState) {
      return !shadowEqual(this.state, oldState) || !shadowEqual(this.props, oldProps, true);
    }
  };
};
},{"15":15}],15:[function(require,module,exports){
module.exports = function(objA, objB, checkChildren){
  if(objA === objB){
    return true;
  }
  if(typeof objA !== 'object' || objA == null || typeof objB !== 'object' || objB == null){
    return false;
  }
  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);
  if(checkChildren){
    keysA = _removeItem(keysA, 'children');
    keysB = _removeItem(keysB, 'children');
  }
 
  
  if(keysA.length !== keysB.length){
    return false;
  }
  var bHasOwn = Object.prototype.hasOwnProperty.bind(objB);
  var key, i, l;
  for(i = 0, l = keysA.length; i < l; i++){
    key = keysA[i];
    if(bHasOwn(keysA[i]) || objA[key] !== objB[key]){
      return false;
    }
  }
  if(checkChildren){
    if(!Array.isArray(objA.children) || !Array.isArray(objB.children)
      || objA.children.length !== objB.children.length) {
      return false;
    }
  }
  return true;
};

function _removeItem(a, item){
  var idx = a.indexOf(item);
  if(idx > -1) a.splice(idx, 1);
  return a;
}
},{}],16:[function(require,module,exports){
var pureRender = require(14);
module.exports = function(){
  return {
    mixins:[pureRender()],
    getInitialProps: function(props){
      if(props && props.sf && props.sf.$type === '__$sf$__'){
        props.sf.signal && this._setupSignals(props.sf);
        props.sf.state  && this._setupFacets(props.sf);
      }
    },
    getInitialState: function(){
      if(this.__facets) return this.__facets.get();
      return {};
    },
    _setupSignals: function(sf){
      var signals = this.signals;
      //setup signals
      if(Array.isArray(signals) && signals.length){
        this.signals = signals.reduce(function(m, name){
          m[name] = sf.signal.getEmitter(name);
          return m;
        }, {});
      }
    },
    _setupFacets: function(sf){
      //setup facets
      this.__facets = sf.state.store.createFacet({
        cursors: this.cursors,
        facets: this.facets
      }, [this.props]);
      this.cursors = this.__facets.cursors;
      this.facets = this.__facets.facets;
      
      //listen to facets' "update" event
      var handler = (function(){
        this.setState(this.__facets.get());
      }).bind(this);
      this.__facets.on('update', handler);
    },
    componentWillUnmount: function(){
      if(!this.__facets) return;
      this.__facets.release();
      this.__facets = null;
    },
    componentWillReceiveProps: function(props){
      if(!this.__facets) return;
      this.__facets.refresh([props]);
      this.setState(this.__facets.get(), true);
    }
  };
};

},{"14":14}]},{},[1]);
