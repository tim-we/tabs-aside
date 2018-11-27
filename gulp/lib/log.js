const fancyLog = require('fancy-log');
const chalk = require('chalk');

function ucFirst(s){
  return s[0].toUpperCase() + s.slice(1);
}

function log(type, id, msg) {
  var status = '';

  switch(type) {
    case 'error':
      status = chalk.red;
    break;
    case 'warning':
      status = chalk.yellow;
      type = 'warn';
    break;
    default:
      status = chalk.green;
    break;
  }
  status = status(`[${ucFirst(type)}]`);

  let quotes = msg.match(/"(.*?)"/g);
  if (quotes != null) {
    quotes.forEach(quote => {
      msg = msg.replace(quote, chalk.green(quote));
    });
  }

  id = chalk.blue(`[${id}]`);

  fancyLog[type](`${status} ${id} ${msg}`);
};

log.pathsToString = (paths) => {
  const projectPath = process.cwd();
  paths = paths.map(path => {
    return `"${path.replace(projectPath, '')}"`;
  });
  return paths.join(', ');
};

module.exports = log;
