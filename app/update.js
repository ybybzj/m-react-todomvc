var curry = require('fnkit/curry');
var store = require('./store');
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