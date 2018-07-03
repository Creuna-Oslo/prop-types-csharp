const fs = require('fs');
const path = require('path');
const test = require('ava');
const webpack = require('webpack');

const webpackConfig = require('../fixtures/webpack.config');

test.cb('Webpack plugin', t => {
  t.plan(3);

  webpack(webpackConfig({}, { mode: 'production' }), (error, stats) => {
    if (error) {
      throw error;
    }

    const compilation = stats.toJson();
    const { outputPath } = compilation;

    const CSharpFilePaths = compilation.assets
      .filter(asset => asset.name.match(/\.cs$/))
      .map(file => file.name);

    t.is(CSharpFilePaths.length, 2);

    CSharpFilePaths.forEach(filePath => {
      const fileContent = fs.readFileSync(
        path.join(outputPath, filePath),
        'utf-8'
      );

      t.snapshot(fileContent);
    });

    t.end();
  });
});
