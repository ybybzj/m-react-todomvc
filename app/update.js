var curry = require('fnkit/curry');
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