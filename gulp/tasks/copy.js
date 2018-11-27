const del = require('del');
const gulp = require('gulp');
const tap = require('gulp-tap');

const path = require('path');

const log = require('../lib/log');
const config = require('../config.js');

const task = {};

const copyPaths = folder => {
  return config.copy.files ? config.copy.files.map(file => {
    return path.resolve(folder, file);
  }) : [];
};

const copy = paths => {
  return gulp.src(paths, { base: config.srcPath})
    .pipe(tap(file => {
      log('info', 'copy:build', `Copy "${file.basename}".`);
    }))
    .pipe(gulp.dest(config.destPath));
};

task['copy:clean'] = () => {
  return del(copyPaths(config.destPath)).then(files => {
    if (files.length > 0) {
      log('info', 'copy:clean', `Deleted ${log.pathsToString(files)}.`);
    }
  });
};

task['copy:build'] = () => {
  return copy(copyPaths(config.srcPath));
};

task['copy:watch:init'] = (done) => {
  gulp.watch(copyPaths(config.srcPath)).on('change', path => {
    log('info', 'copy:watch', `File "${path}" has changed.`);
    copy(path);
  });
  done();
};

task['copy'] = ['copy:clean', 'copy:build'];
task['copy:watch'] = ['copy', 'copy:watch:init'];

module.exports.task = task;
