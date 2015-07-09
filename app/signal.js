var r$ = require('r-stream');
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