const fs = require('fs');
const path = require('path');
const tempy = require('tempy');
const test = require('ava');
const webpack = require('webpack');

const webpackConfig = require('../fixtures/webpack.config');

test.cb('Writes C# files to disk', t => {
  t.plan(4);

  webpack(
    webpackConfig({ path: tempy.directory() }, { mode: 'production' }),
    (error, stats) => {
      if (error) {
        throw error;
      }

      const compilation = stats.toJson();
      const { outputPath } = compilation;

      const CSharpFilePaths = compilation.assets
        .filter(asset => asset.name.match(/\.cs$/))
        .map(file => file.name);

      t.is(CSharpFilePaths.length, 3);

      CSharpFilePaths.forEach(filePath => {
        const fileContent = fs.readFileSync(
          path.join(outputPath, filePath),
          'utf-8'
        );

        t.snapshot(fileContent);
      });

      t.end();
    }
  );
});
