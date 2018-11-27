const gulp = require('gulp');

module.exports = (tasks) => {
  tasks.forEach((name) => {
    const module = require('./tasks/' + name);

    for (let taskname in module.task) {
      if (Array.isArray(module.task[taskname])) {
        gulp.task(taskname, gulp.series(...module.task[taskname]));
      } else {
        gulp.task(taskname, module.task[taskname]);
      }
    }
  });

  return gulp;
};
