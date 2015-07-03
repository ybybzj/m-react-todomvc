var m = require('m-react');
var sfMixin = require('m-react-mixins/s-flow');
function createPageComponent(options){
  options.mixins =  options.mixins || [];
  options.mixins = [].concat(options.mixins);
  options.mixins.push(sfMixin());
  return m.createComponent(options);
}
module.exports = createPageComponent;