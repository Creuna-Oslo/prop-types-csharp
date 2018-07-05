const path = require('path');

const PropTypesCSharpPlugin = require('../index').PropTypesCSharpPlugin;

module.exports = function(env, options = {}) {
  return {
    entry: './fixtures/app.js',
    output: {
      path: path.resolve(__dirname, '..', 'dist'),
      filename: '[name].js'
    },
    mode: options.mode,
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: ['babel-loader', 'eslint-loader']
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx']
    },
    plugins: [new PropTypesCSharpPlugin({ path: 'classes' })]
  };
};
