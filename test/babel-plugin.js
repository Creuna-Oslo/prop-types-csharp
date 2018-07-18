const fs = require('fs');
const path = require('path');
const tempy = require('tempy');
const test = require('ava');
const webpack = require('webpack');

const webpackConfig = require('../fixtures/webpack.config');

test.cb('Removes propTypesMeta', t => {
  t.plan(1);

  webpack(
    webpackConfig(
      { babelPlugin: true, path: tempy.directory() },
      { mode: 'production' }
    ),
    (error, stats) => {
      if (error) {
        throw error;
      }

      const compilation = stats.toJson();
      const { outputPath } = compilation;
      const mainJs = compilation.assets.find(asset => asset.name === 'main.js');

      const mainJsContent = fs.readFileSync(
        path.join(outputPath, mainJs.name),
        'utf-8'
      );

      t.is(mainJsContent.includes('propTypesMeta'), false);

      t.end();
    }
  );
});
