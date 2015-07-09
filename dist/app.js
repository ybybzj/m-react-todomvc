(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var router = require("page");
var Page = require(5);
var m = require("m-react");
var signal = require(6);
var updates = require(8);
var store = require(7);
var rootEl = document.getElementById('todoapp');
updates(function(sig, handler){
  signal[sig].on(handler);
});

// var app = SF({
//   state: require('./state'),
//   signal: require('./signal'),
//   watch: require('./update')
// });

store.onUpdate(function(){
  m.render(document.getElementById('todoapp'), Page);
})
m.render(rootEl, Page);

router('/:filter?', function(cxt){
  var filter = cxt.params.filter;
  filter = filter == null ? 'all': filter.trim() == '' ? 'all': filter.trim();
  signal.filterChanged(filter);
});
router();
},{"5":5,"6":6,"7":7,"8":8,"m-react":"m-react","page":"page"}],2:[function(require,module,exports){
var m = require("m-react");
var cx = require(9).classNames;
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
},{"9":9,"m-react":"m-react"}],3:[function(require,module,exports){
var m = require("m-react");
var ESCAPE_KEY = 27;
var ENTER_KEY = 13;
module.exports = m.createComponent({
  getInitialState: function(){
    return {
      text: ''
    };
  },
  // componentWillReceiveProps: function(){
  //   console.log('Header Component');
  // },
  render: function(){
    return (
      {tag: "header", attrs: {id:"header", class:"header"}, children: [
        {tag: "h1", attrs: {}, children: ["todos"]}, 
        {tag: "input", attrs: {
          id:"new-todo", 
          class:"new-todo", 
          value:this.state.text, 
          placeholder:"What needs to be done?", 
          evKeyUp:this.onHandleNewTodoKeyUp, 
          autoFocus:true}
        }
      ]}
    );
  },
  onHandleNewTodoKeyUp: function(e){
    var val = e.target.value.trim();
    if(e.which === ESCAPE_KEY){
      this.setState({text: ''});
    }else if(e.which === ENTER_KEY && val !== ''){
      if(this.props.onTodoCreated)
          this.props.onTodoCreated({val: val});
      this.setState({text: ''});
    }else{
      this.setState({text: val});
    }
  },
});
},{"m-react":"m-react"}],4:[function(require,module,exports){
var m = require("m-react");
var _ = require(9);
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
},{"9":9,"m-react":"m-react"}],5:[function(require,module,exports){
var m = require("m-react");
// var createPage = require('./createPageComponent');
var TodoItem = require(4);
var TodoFooter = require(2);
var TodoHeader = require(3);
var page = require("page");
var store = require(7);
var signals = require(6);
var App = m.createComponent({
  render: function () {
    var footer;
    var main;
    var todos = store.allTodos,
        activeTodoCount = store.activeTodoCount(),
        completedCount = store.completedCount(),
        filter = store.filter();
    var todoItems = store.shownTodos().map(function (todo) {
      return (
        m.component(TodoItem, {
          key:todo.id, 
          todo:todo, 
          onToggle:signals.todoToggled, 
          onDestroy:signals.todoDestroyed, 
          onEdit:signals.todoEdited, 
          onSave:signals.todoSaved, 
          onCancel:signals.todoCanceled}
        )
      );
    }, this);


    if (activeTodoCount || completedCount) {
      footer =
        m.component(TodoFooter, {
          count:activeTodoCount, 
          completedCount:completedCount, 
          filter:filter, 
          onClearCompleted:signals.completedCleared}
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
            checked:activeTodoCount === 0}
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
          onTodoCreated:signals.todoCreated}
        ), 
        main, 
        footer
      ]}
    );
  },
  
  onToggleAll: function(e){
    var completed = e.target.checked;
    signals.allToggled(!!completed);
  }
});
module.exports = App;
},{"2":2,"3":3,"4":4,"6":6,"7":7,"m-react":"m-react","page":"page"}],6:[function(require,module,exports){
// module.exports = function(signal){
//   signal.add('filterChanged')
//     .add('completedCleared')
//     .add('allToggled')
//     .add('todoToggled')
//     .add('todoEdited')
//     .add('todoDestroyed')
//     .add('todoSaved')
//     .add('todoCanceled')
//     .add('todoCreated');
// };
var r$ = require("r-stream");
module.exports = {
  filterChanged: r$(),
  completedCleared: r$(),
  allToggled: r$(),
  todoToggled: r$(),
  todoEdited: r$(),
  todoDestroyed: r$(),
  todoSaved: r$(),
  todoCanceled: r$(),
  todoCreated: r$()
};
},{"r-stream":"r-stream"}],7:[function(require,module,exports){
var bSearch = require(9).bSearch;
var store = {
  todos:[],
  filter: 'all',
  nextId: 0
};

module.exports = {
  filter: function (){
    if(arguments.length === 0){
      return store.filter;
    }else{
      store.filter = arguments[0];
      this.triggerUpdate();
    }
  },
  shownTodos: function(){
    return store.todos.filter(function(item) {
          switch (store.filter) {
            case 'active':
              return !item.completed;
            case 'completed':
              return item.completed;
            default:
              return true;
          }
        });
  },
  completedCount: function(){
    return store.todos.reduce(function(accum, todo) {
          return !todo.completed ? accum : accum + 1;
        }, 0);
  },
  activeTodoCount: function(){
    return store.todos.length - this.completedCount();
  },
  allTodos: function(){
    return store.todos;
  },
  updateTodo: function(id, update){
    var todoIdx = bSearch(store.todos, id, _compare);
    _update(store.todos[todoIdx], update);
    this.triggerUpdate();
  },
  updateTodos: function(update){
    store.todos.forEach(_update.bind(null, update));
    this.triggerUpdate();
  },
  newTodo: function(title){
    var newTodo = {
      title: title,
      status: 'created'
    };
  
    newTodo.id = store.nextId;
    store.todos.unshift(newTodo);
    store.nextId++;
    this.triggerUpdate();
  },
  destroyTodo: function(id){
    var todoIdx = bSearch(store.todos, id, _compare);
    if(todoIdx !== -1){
      store.todos.splice(todoIdx, 1);
    }
    this.triggerUpdate();
  },
  triggerUpdate: function(){
    var self = this;
    if(typeof this._onUpdate === 'function'){
      if(this._timer){
        clearTimeout(this._timer);
      }
      this._timer = setTimeout(function(){
        self._onUpdate();
        self._timer = null;
      }, 16);
      
    }
  },
  onUpdate: function(fn){
    this._onUpdate = fn;
  }
};

function _compare(targetId, todo){
  return todo.id - targetId;
}
function _update(updates, todo){
  Object.keys(updates).forEach(function(k){
    todo[k] = updates[k];
  });
  return todo;
}
},{"9":9}],8:[function(require,module,exports){
var curry = require(10);
var store = require(7);
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

function onTodoDestroyed(data){
  store.destroyTodo(data.id);
}

function onTodoCreated(data){
  store.newTodo(data.val);
}

function onFilterChanged(filter){
  store.filter(filter);
}

//helpers
var _updateTodo = curry(2, function _updateTodo(update, data){
  if(typeof update === 'function'){
    update = update(data);
  }
  store.updateTodo(data.id, update);
});

var _updateTodos = curry(2, function _updateTodos(update, data){
  if(typeof update === 'function'){
    update = update(data);
  }
  store.updateTodos(update);
});
},{"10":10,"7":7}],9:[function(require,module,exports){
function classNames(classes) {
  var cs = '';
  for (var i in classes) {
    cs += (classes[i]) ? i + ' ' : '';
  }
  return cs.trim();
}
/**
 * [bSearch description]
 * @param  {[Array]} arr    sorted array
 * @param  {[Any]} target   [description]
 * @param  {[Function]} compareFn(target, item){} return -1, 0, 1
 * @return {[Integer]}           index in arr
 */
function bSearch(arr, target, compareFn){
  if(arr.length === 0) return -1;
  return _rBSearch(arr, target, compareFn, 0, arr.length - 1);
}

function _rBSearch(arr, target, compareFn, startIdx, endIdx){
  if(startIdx < 0 || endIdx < 0){
    throw new Error('[bSearch]Invalid index arguments!given: s=>' + startIdx + ', e=>' + endIdx);
  }
  if(startIdx > endIdx) return -1;
  var midIdx = Math.floor((endIdx - startIdx)/2) + startIdx,
      startComResult, midComResult, endComResult, resultIdx = -1;
  startComResult = compareFn(target, arr[startIdx]);
  endComResult = compareFn(target, arr[endIdx]);
  resultIdx = startComResult === 0 ? startIdx:
        endComResult === 0 ? endIdx : -1;
  if(resultIdx === -1){
    if(startIdx === endIdx || midIdx === startIdx){ return resultIdx; }
    midComResult = compareFn(target, arr[midIdx]);
    if(midComResult === 0){
      resultIdx = midIdx;
    }else if(midComResult < 0){
      resultIdx = _rBSearch(arr, target, compareFn, startIdx + 1, midIdx - 1);
    }else if(midComResult > 0){
      resultIdx = _rBSearch(arr, target, compareFn, midIdx + 1, endIdx - 1);
    }
  }
  return resultIdx;
}

module.exports = {
  classNames: classNames,
  bSearch: bSearch
};
},{}],10:[function(require,module,exports){
var __ = require(11);
var slice = require(12);

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
},{"11":11,"12":12}],11:[function(require,module,exports){
module.exports = Object.create(null);
},{}],12:[function(require,module,exports){
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
},{}]},{},[1]);
