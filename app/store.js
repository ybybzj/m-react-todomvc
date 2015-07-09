var bSearch = require('./utils').bSearch;
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