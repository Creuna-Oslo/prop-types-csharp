const fs = require('fs');
const path = require('path');
const tempy = require('tempy');
const test = require('ava');
const webpack = require('webpack');

const { classes } = require('../../fixtures/source-code');
const normalize = require('../utils/_normalize-string');
const webpackConfig = require('../../fixtures/webpack.config');

test.cb('Writes C# files to disk', t => {
  t.plan(4);

  webpack(
    webpackConfig({ path: tempy.directory() }, { mode: 'production' }),
    (error, stats) => {
      if (error) {
        throw error;
      }

      t.false(stats.hasErrors());

      const compilation = stats.toJson();
      const { outputPath } = compilation;

      const CSharpFilePaths = compilation.assets
        .filter(asset => asset.name.match(/\.cs$/))
        .map(file => file.name);

      t.is(CSharpFilePaths.length, 2);

      const CSharpFiles = CSharpFilePaths.reduce((accum, filePath) => {
        const fileName = path.basename(filePath, '.cs');
        return Object.assign(accum, {
          [fileName]: fs.readFileSync(path.join(outputPath, filePath), 'utf-8')
        });
      }, {});

      t.is(
        normalize(classes.classComponent),
        normalize(CSharpFiles.ClassComponent)
      );

      t.is(
        normalize(classes.funcComponent),
        normalize(CSharpFiles.FunctionalComponent)
      );

      t.end();
    }
  );
});

test.cb('Adds base class', t => {
  t.plan(2);

  webpack(
    webpackConfig(
      {
        entry: './fixtures/app-baseclass.js',
        path: tempy.directory(),
        baseClass: 'BaseClass'
      },
      { mode: 'production' }
    ),
    (error, stats) => {
      if (error) {
        throw error;
      }

      t.false(stats.hasErrors());

      const compilation = stats.toJson();
      const { outputPath } = compilation;

      const CSharpFilePaths = compilation.assets
        .filter(asset => asset.name.match(/\.cs$/))
        .map(file => file.name);

      const CSharpFiles = CSharpFilePaths.reduce((accum, filePath) => {
        const fileName = path.basename(filePath, '.cs');
        return Object.assign(accum, {
          [fileName]: fs.readFileSync(path.join(outputPath, filePath), 'utf-8')
        });
      }, {});

      t.is(
        normalize(classes.baseClassComponent),
        normalize(CSharpFiles.BaseClassComponent)
      );

      t.end();
    }
  );
});

test.cb('Aborts when duplicate names exist', t => {
  t.plan(2);

  webpack(
    webpackConfig(
      {
        entry: './fixtures/app-duplicate-component.js',
        path: tempy.directory()
      },
      { mode: 'production' }
    ),
    (error, stats) => {
      if (error) {
        throw error;
      }

      t.true(stats.hasErrors());

      const compilation = stats.toJson();

      const CSharpFilePaths = compilation.assets
        .filter(asset => asset.name.match(/\.cs$/))
        .map(file => file.name);

      t.is(CSharpFilePaths.length, 0);

      t.end();
    }
  );
});
