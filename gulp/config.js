module.exports = {
  env: process.argv.includes('--prod') ? 'prod' : 'dev',

  srcPath: './src',
  destPath: './dist',

  copy: {
    files: [
      'manifest.json',
      'img/**/*',
      'html/**/*',
      'fonts/**/*',
      '_locales/**/*'
    ]
  },

  css: {
    src: 'scss/*.scss',
    dest: 'css',
    watch: 'scss/**/*.scss'
  },

  js: {
    src: 'ts/**/*.ts',
    dest: 'js'
  }

};
