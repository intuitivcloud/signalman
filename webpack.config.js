/*!
 * signalman
 * Copyright (c) 2015 intuitivcloud Systems <engineering@intuitivcloud.com>
 * BSD-3-Clause Licensed
 */

/* eslint camelcase: 0 */

'use strict';

// module dependencies
var path = require('path'),
    webpack = require('webpack');

var copyrightBanner = 'signalman\nCopyright (c) 2015 intuitivcloud Systems <engineering@intuitivcloud.com>\nBSD-3-Clause Licensed';

module.exports = {
  entry: './index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'signalman.js'
  },
  target: 'web',
  cache: false,
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(true),
    new webpack.optimize.DedupePlugin(),
    // new webpack.optimize.UglifyJsPlugin({
    //   compress: {
    //     dead_code: true,
    //     unused: true,
    //     warnings: true,
    //     join_vars: true
    //   },
    //   output: {
    //     comments: false
    //   },
    //   mangle: true
    // }),
    new webpack.BannerPlugin(copyrightBanner, { entryOnly: true })
  ]
};
