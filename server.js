var express = require('express');
// var browserify = require('browserify-middleware');
var compression = require('compression');
var logger = require('morgan');
// var plugins = [{
//   plugin: require('bundle-collapser/plugin')
// }];
// var $node = {
//   path: require('path')
// };
var app = express();
app.use(compression());
app.use(logger('dev'));
app.use(express.static(__dirname));
// var bundles = ['m-react', 'm-react-mixins', 'fnkit', 's-flow', 'page'];
// app.get('/bundle.js', browserify(bundles, {
//   cache: true,
//   precompile: true,
//   // debug: true,
//   // minify: true,
//   plugins: plugins
// }));
// app.get('/app.js', browserify('./app/app.js', {
//   transform: ['mithrilify'],
//   external: bundles,
//   // debug: true,
//   // minify: true,
//   plugins: plugins
// }));
app.listen(3000);