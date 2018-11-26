const del = require('del');
const gulp = require('gulp');
const ts = require('gulp-typescript');

const path = require('path');

const log = require('../lib/log');
const config = require('../config.js');

const task = {};
const srcPath = path.resolve(config.srcPath, config.js.src);
const destPath = path.resolve(config.destPath, config.js.dest);
const tsProject = ts.createProject('tsconfig.json');

task['js:clean'] = () => {
  return del(destPath).then(paths => {
    if (paths.length > 0) {
      log('info', 'js:clean', `Deleted ${log.pathsToString(paths)}.`);
    }
  });
};

task['js:build'] = () => {
  const tsResult = gulp.src(srcPath)
    .pipe(tsProject());
  return tsResult.js.pipe(gulp.dest(destPath));
};

task['js:watch:init'] = (done) => {
  gulp.watch(srcPath, gulp.series('js:build'));
  done();
};

task['js'] = ['js:clean', 'js:build'];
task['js:watch'] = ['js', 'js:watch:init'];

module.exports.task = task;
