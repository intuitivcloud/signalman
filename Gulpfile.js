/*!
 * signalman
 * Copyright (c) 2015 intuitivcloud Systems <engineering@intuitivcloud.com>
 * BSD-3-Clause Licensed
 */

'use strict';

// module dependencies
var gulp = require('gulp'),
    webpack = require('webpack');

var t = require('gulp-load-plugins')({ scope: 'devDependencies' }),
    paths = {
      SRC_PATH: ['./index.js', './lib/**/*.js', './Gulpfile.js', './webpack.config.js'],
      LIB_PATH: './lib'
    };

gulp.task('lint', function () {
  gulp.src(paths.SRC_PATH)
    .pipe(t.eslint())
    .pipe(t.eslint.format());
});

gulp.task('build-dist', function (done) {
  webpack(require('./webpack.config'), function (err, stats) {
    if (err) throw new t.util.PluginError('webpack', err);
    t.util.log('[webpack]', stats.toString({
      assets: true,
      modules: true,
      timings: true,
      reasons: true,
      colors: true
    }));
  });
});

gulp.task('watch', function () {
  gulp.watch(paths.SRC_PATH, ['lint', 'build-dist']);
});

gulp.task('default', ['lint', 'build-dist', 'watch']);
gulp.task('build', ['lint', 'build-dist']);
