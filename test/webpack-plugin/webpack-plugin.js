/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const tempy = require('tempy');
const test = require('ava');
const webpack = require('webpack');

const { classes } = require('../../fixtures/javascript/source-code');
const normalize = require('../utils/_normalize-string');
const webpackConfig = require('../../fixtures/javascript/webpack.config');

test.cb('Writes C# files to disk', t => {
  t.plan(3);

  webpack(
    webpackConfig({ path: tempy.directory() }, { mode: 'production' }),
    (error, stats) => {
      if (error) {
        throw error;
      }

      const compilation = stats.toJson();

      if (stats.hasErrors()) {
        t.fail(compilation.errors);
        return;
      }

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
  t.plan(1);

  webpack(
    webpackConfig(
      {
        entry: './fixtures/javascript/app-baseclass.js',
        path: tempy.directory(),
        compilerOptions: {
          namespace: 'Namespace',
          baseClass: 'BaseClass'
        }
      },
      { mode: 'production' }
    ),
    (error, stats) => {
      if (error) {
        throw error;
      }

      const compilation = stats.toJson();

      if (stats.hasErrors()) {
        t.fail(compilation.errors);
        return;
      }

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

const throwsTemplate = (t, entry, expectedErrorMessage) => {
  t.plan(3);

  webpack(
    webpackConfig(
      {
        entry,
        path: tempy.directory()
      },
      { mode: 'production' }
    ),
    (error, stats) => {
      if (error) {
        // To see webpack errors when running tests
        throw error;
      }

      const compilation = stats.toJson();

      t.is(1, compilation.errors.length);
      t.is(normalize(expectedErrorMessage), normalize(compilation.errors[0]));

      const CSharpFilePaths = compilation.assets
        .filter(asset => asset.name.match(/\.cs$/))
        .map(file => file.name);

      t.is(CSharpFilePaths.length, 0);

      t.end();
    }
  );
};

const duplicateComponent1Path = path.resolve(
  __dirname,
  '../../fixtures/javascript/func-component.jsx'
);
const duplicateComponent2Path = path.resolve(
  __dirname,
  '../../fixtures/javascript/nested-component/func-component.jsx'
);

test.cb(
  'Aborts when duplicate names exist',
  throwsTemplate,
  './fixtures/javascript/app-duplicate-component.js',
  `C# class generator plugin
Found duplicate component names in:
FunctionalComponent (${duplicateComponent1Path})
FunctionalComponent (${duplicateComponent2Path})`
);

const errorComponentPath = path.resolve(
  __dirname,
  '../../fixtures/javascript/error-component.jsx'
);

test.cb(
  'Aborts when class generation fails',
  throwsTemplate,
  './fixtures/javascript/app-error-component.js',
  `C# class generator plugin
${errorComponentPath}
Invalid type for prop 'a' ('object').
Replace with 'PropTypes.shape' or provide a meta type`
);
