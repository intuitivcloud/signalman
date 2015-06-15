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
      TEST_PATH: ['./tests/**/*.tests.js'],
      LIB_PATH: './lib'
    };

gulp.task('lint', function () {
  gulp.src(paths.SRC_PATH.concat(paths.TEST_PATH))
    .pipe(t.eslint())
    .pipe(t.eslint.format());
});

gulp.task('build-dist', ['lint'], function (done) {
  webpack(require('./webpack.config'), function (err, stats) {
    if (err) done(new t.util.PluginError('webpack', err));
    t.util.log('[webpack]', stats.toString({
      assets: true,
      modules: true,
      timings: true,
      reasons: true,
      colors: true
    }));
    done();
  });
});

gulp.task('test', ['build-dist'], function () {
  gulp.src(paths.TEST_PATH)
    .pipe(t.mocha({reporter: 'spec'}));
});

gulp.task('watch', function () {
  gulp.watch(paths.SRC_PATH.concat(paths.TEST_PATH), ['lint', 'build-dist', 'test']);
});

gulp.task('default', ['lint', 'build-dist', 'test', 'watch']);
gulp.task('build', ['lint', 'build-dist', 'test']);
