const path = require('path');

const PropTypesCSharpPlugin = require('../index');

module.exports = function(env = {}, options = {}) {
  return {
    entry: env.entry || './fixtures/app.js',
    output: {
      path: env.path || path.resolve(__dirname, '..', 'dist'),
      filename: '[name].js'
    },
    mode: options.mode,
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                plugins: env.babelPlugin
                  ? [path.join(__dirname, '../babel-plugin')]
                  : []
              }
            },
            'eslint-loader'
          ]
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx']
    },
    plugins: [new PropTypesCSharpPlugin({ path: 'classes' })]
  };
};
