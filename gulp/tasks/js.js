const del = require('del');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const concat = require('gulp-concat');
const browserify = require('browserify');
const watchify = require('watchify');
const babelify = require('babelify');
const sourcestream = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const mergeStreams = require('merge-stream');
const sourcemaps = require('gulp-sourcemaps');
const tap = require('gulp-tap');

const path = require('path');
const fs = require('fs');

const log = require('../lib/log');
const config = require('../config.js');

const task = {};
const destPath = path.resolve(config.destPath, config.js.dest);

// browserify
const getBundler = (type, source) => {
  let args = { debug: config.env === 'dev' };
  if (type === 'watch') {
    args = Object.assign(args, watchify.args);
  }
  const b = browserify(path.resolve(config.srcPath, source.entryFile), args)
    .plugin('tsify')
    .transform(babelify, {
      presets: config.js.babelify.presets,
      extensions: config.js.babelify.extensions
    });
  return type === 'watch' ? watchify(b) : b;
};

// generate bundle
const createBundle = (bundlerType, bundleConfig) => {
  const sourceStreams = [];

  bundleConfig.src.forEach(source => {
    switch (source.type) {
      case 'concat':
        source.files.forEach(fileSrc => {
          sourceStreams.push(gulp.src(
            path.resolve(config.srcPath, fileSrc)
          ));
        });
      break;

      case 'browserify':
        let bundler;
        if (bundlerType === 'watch') {
          bundler =  getBundler('watch', source);
          bundler.on('update', file => {
            createBundle('watch', bundleConfig);
          });
          bundler.on('log', () => {
            log('info', 'js:build', `Build "${bundleConfig.name}".`);
          });
        }
        else {
          bundler = getBundler('default', source);
        }
        sourceStreams.push(
          bundler
            .bundle()
            .on('error', error => {
              log('error', 'js:build', `Browserify: [${error.name}] ${error.message}`);
            })
            .pipe(sourcestream(bundleConfig.name))
            .pipe(buffer())
        );
      break;
    }
  });

  return mergeStreams(...sourceStreams)
    .pipe(gulpif(config.env === 'dev', sourcemaps.init({ loadMaps: true })))
    .pipe(concat(bundleConfig.name))
    .pipe(tap(file => {
      if (bundlerType !== 'watch') log('info', 'js:build', `Build "${file.basename}".`);
    }))
    .pipe(gulpif(config.env === 'dev', sourcemaps.write('.')))
    .pipe(gulp.dest(destPath));
};

task['js:clean'] = () => {
  return del(destPath).then(paths => {
    if (paths.length > 0) {
      log('info', 'js:clean', `Deleted ${log.pathsToString(paths)}.`);
    }
  });
};

task['js:build'] = () => {
  const streams = config.js.bundles.map(bundleConfig => {
    return createBundle('default', bundleConfig);
  });
  return mergeStreams(...streams);
};

task['js:watch:init'] = (done) => {
  config.js.bundles.forEach(bundleConfig => {
    createBundle('watch', bundleConfig);

    bundleConfig.src.forEach(source => {
      if (source.type === 'concat') {
        gulp.watch(source.files, function js() { return createBundle('default', bundleConfig) })
        .on('change', path => {
          log('info', 'js:watch', `File "${path}" has changed.`);
        });
      }
    });
  });
  done();
};

task['js'] = ['js:clean', 'js:build'];
task['js:watch'] = ['js', 'js:watch:init'];

module.exports.task = task;
