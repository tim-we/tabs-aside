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
    dest: 'js',
    bundles: [
      {
        name: 'background.js',
        src: [{
          type: 'browserify',
          entryFile: 'ts/background/background.ts'
        }]
      },
      {
        name: 'bmSelector.js',
        src: [{
          type: 'browserify',
          entryFile: 'ts/bookmark-selector/Controller.ts'
        }]
      },
      {
        name: 'menu.js',
        src: [{
          type: 'browserify',
          entryFile: 'ts/browserAction/Menu.ts'
        }]
      },
      {
        name: 'options.js',
        src: [{
          type: 'browserify',
          entryFile: 'ts/options/OptionsPage.ts'
        }]
      },
      {
        name: 'sidebar.js',
        src: [{
          type: 'browserify',
          entryFile: 'ts/sidebar/sidebar.ts'
        }]
      },
      {
        name: 'tabSelector.js',
        src: [{
          type: 'browserify',
          entryFile: 'ts/browserAction/TabSelector.ts'
        }]
      },
      {
        name: 'privileged.js',
        src: [{
          type: 'browserify',
          entryFile: 'ts/extension-pages/privileged.ts'
        }]
      }
    ],
    browserify: {
      paths: ['./node_modules', './src/ts'],
      extensions: ['.ts']
    },
    babelify: {
      presets: [
        ['@babel/preset-env'],
        ['@babel/preset-typescript']
      ],
      plugins: [
        "@babel/proposal-class-properties",
        "@babel/proposal-object-rest-spread"
      ],
      extensions: ['.ts','.js']
    }
  }

};
