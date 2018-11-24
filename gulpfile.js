const gulp = require('./gulp')([
  'copy',
  'css',
  'js'
]);

gulp.task('default', gulp.series(
  'copy',
  'css',
  'js'
));

gulp.task('watch', gulp.series(
  'copy:watch',
  'css:watch',
  'js:watch'
));
