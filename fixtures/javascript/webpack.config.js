const path = require('path');

const PropTypesCSharpPlugin = require('../../webpack-plugin');

module.exports = function(env = {}, options = {}) {
  return {
    entry: env.entry || './fixtures/javascript/app.js',
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
                plugins: [].concat(
                  env.babelPlugin
                    ? [path.join(__dirname, '../../babel-plugin')]
                    : [],
                  '@babel/proposal-class-properties'
                )
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
    plugins: [
      new PropTypesCSharpPlugin({
        compilerOptions: env.compilerOptions,
        path: 'classes'
      })
    ]
  };
};
