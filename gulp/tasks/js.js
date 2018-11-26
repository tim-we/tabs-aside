const del = require('del');
const gulp = require('gulp');
const ts = require('gulp-typescript');
const gulpif = require('gulp-if');
const sourcemaps = require('gulp-sourcemaps');

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
    .pipe(gulpif(config.env === 'dev', sourcemaps.init({ loadMaps: true })))
    .pipe(tsProject())
    .on('error', () => {});
  log('info', 'js:build', `Build "${config.js.src}".`);
  return tsResult.js
    .pipe(gulpif(config.env === 'dev', sourcemaps.write('.', { sourceRoot: './', includeContent: false })))
    .pipe(gulp.dest(destPath));
};

task['js:watch:init'] = (done) => {
  gulp.watch(srcPath, gulp.series('js:build'))
    .on('change', path => {
      log('info', 'js:build', `File "${path}" has changed.`)
    });
  done();
};

task['js'] = ['js:clean', 'js:build'];
task['js:watch'] = ['js', 'js:watch:init'];

module.exports.task = task;
