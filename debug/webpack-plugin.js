/* eslint-disable no-console */
const webpack = require('webpack');

const webpackConfig = require('../fixtures/webpack.config');

webpack(webpackConfig({ mode: 'production' }), (err, stats) => {
  console.log(stats.toString());
});
