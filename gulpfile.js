var browserify = require('browserify');
var source = require('vinyl-source-stream');
var gulp = require('gulp');
var rm = require('rimraf');
var runSequence = require('run-sequence');

var externals = ['m-react', 'm-react-mixins', 'fnkit', 's-flow', 'page'];

function buildBundle(cfg){
  return browserify(cfg)
    .plugin('bundle-collapser/plugin');
}

gulp.task('clean', function(cb){
  require('rimraf')('dist', cb);
});
gulp.task('build:bundle', function(){
  var bundler = buildBundle({
    require: externals
  });
  bundler.bundle().pipe(source('bundle.js'))
    .pipe(gulp.dest('dist'));
});
gulp.task('build:app', function(){
  var bundler = buildBundle({
    entries:['app/app.js']
  }).transform(require('mithrilify')).external(externals);

  bundler.bundle().pipe(source('app.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', function(cb){
  runSequence('clean', 'build:bundle', 'build:app', cb);
});