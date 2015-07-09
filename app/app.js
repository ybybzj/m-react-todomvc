var router = require('page');
var Page = require('./page.msx');
var m = require('m-react');
var signal = require('./signal');
var updates = require('./update');
var store = require('./store');
var rootEl = document.getElementById('todoapp');
updates(function(sig, handler){
  signal[sig].on(handler);
});


store.onUpdate(function(){
  m.render(document.getElementById('todoapp'), <Page/>);
})
m.render(rootEl, <Page/>);

router('/:filter?', function(cxt){
  var filter = cxt.params.filter;
  filter = filter == null ? 'all': filter.trim() == '' ? 'all': filter.trim();
  signal.filterChanged(filter);
});
router();