const del = require('del');
const gulp = require('gulp');
const sass = require('gulp-sass');
const gulpif = require('gulp-if');
const sourcemaps = require('gulp-sourcemaps');
const tap = require('gulp-tap');

const path = require('path');

const log = require('../lib/log');
const config = require('../config.js');

const task = {};
const srcPath = path.resolve(config.srcPath, config.css.src);
const destPath = path.resolve(config.destPath, config.css.dest);
const watchPath = path.resolve(config.srcPath, config.css.watch);

task['css:clean'] = () => {
  return del(destPath).then(files => {
    if (files.length > 0) {
      log('info', 'css:clean', `Deleted ${log.pathsToString(files)}.`);
    }
  });
};

task['css:build'] = () => {
  return gulp.src(srcPath)
    .pipe(gulpif(config.env === 'dev', sourcemaps.init({ loadMaps: true })))
    .pipe(sass({
      outputStyle: config.env === 'dev' ? 'expanded' : 'compressed'
    }).on('error', error => {
      let errMsg = error.formatted.split("\n");
      log('error', 'css:build', `Sass: ${errMsg[0] + errMsg[1]}`);
    }))
    .pipe(tap(file => {
      log('info', 'css:build', `Build "${file.basename}".`);
    }))
    .pipe(gulpif(config.env === 'dev', sourcemaps.write('.')))
    .pipe(gulp.dest(destPath));
};

// task csswatch
task['css:watch:init'] = (done) => {
  gulp.watch(watchPath, gulp.series('css'))
    .on('change', path => {
      log('info', 'css:watch', `File "${path}" has changed.`)
    });
  done();
};

task['css'] = ['css:clean', 'css:build'];
task['css:watch'] = ['css', 'css:watch:init'];

module.exports.task = task;
