const path = require('path');

const PropTypesCSharpPlugin = require('../index').PropTypesCSharpPlugin;

module.exports = function(env, options = {}) {
  const production = options.mode === 'production';

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
          use: [
            'babel-loader',
            'eslint-loader',
            path.resolve('source/loader/proptypes-meta-loader')
          ]
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx']
    },
    plugins: production ? [new PropTypesCSharpPlugin({ path: 'classes' })] : []
  };
};
