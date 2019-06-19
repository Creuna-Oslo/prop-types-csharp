/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const tempy = require('tempy');
const test = require('ava');
const webpack = require('webpack');

const { classes } = require('../../fixtures/javascript/source-code');
const normalize = require('../utils/_normalize-string');
const webpackConfig = require('../../fixtures/javascript/webpack.config');

const runWebpack = (entry, pluginOptions, callback) => {
  webpack(
    webpackConfig({ entry, path: tempy.directory() }, pluginOptions),
    (error, stats) => {
      if (error) throw error; // To see webpack errors when running tests
      callback(stats.toJson());
    }
  );
};

const runWebpackAndTest = (title, entry, pluginOptions, assertionFn) => {
  test.cb(title, t => {
    runWebpack(entry, pluginOptions, compilation => {
      const { errors } = compilation;
      if (errors && errors.length > 0) t.fail(compilation.errors);
      assertionFn(t, compilation);
      t.end();
    });
  });
};

const runWebpackAndTestError = (title, entry, expectedErrorMessage) => {
  test.cb(title, t => {
    runWebpack(entry, {}, compilation => {
      t.is(1, compilation.errors.length);
      t.is(normalize(expectedErrorMessage), normalize(compilation.errors[0]));

      const CSharpFilePaths = compilation.assets
        .filter(asset => asset.name.match(/\.cs$/))
        .map(file => file.name);

      t.is(CSharpFilePaths.length, 0);
      t.end();
    });
  });
};

runWebpackAndTest(
  'Writes C# files to disk',
  './fixtures/javascript/app.js',
  {},
  (t, compilation) => {
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
  }
);

runWebpackAndTest(
  'Adds base class',
  './fixtures/javascript/app-baseclass.js',
  {
    compilerOptions: {
      namespace: 'Namespace',
      baseClass: 'BaseClass'
    }
  },
  (t, compilation) => {
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
  }
);

const duplicate1Path = path.resolve(
  __dirname,
  '../../fixtures/javascript/func-component.jsx'
);
const duplicate2Path = path.resolve(
  __dirname,
  '../../fixtures/javascript/nested-component/func-component.jsx'
);

runWebpackAndTestError(
  'Aborts when duplicate names exist',
  './fixtures/javascript/app-duplicate-component.js',
  `C# class generator plugin
Found duplicate component names in:
FunctionalComponent (${duplicate1Path})
FunctionalComponent (${duplicate2Path})`
);

const errorComponentPath = path.resolve(
  __dirname,
  '../../fixtures/javascript/error-component.jsx'
);

runWebpackAndTestError(
  'Aborts when class generation fails',
  './fixtures/javascript/app-error-component.js',
  `C# class generator plugin
${errorComponentPath}
Invalid type for prop 'a' ('object').
Replace with 'PropTypes.shape' or provide a meta type`
);
