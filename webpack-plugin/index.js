const path = require('path');

const filterPaths = require('./filter-paths');
const getFileExtension = require('./get-file-extension');
const generateClasses = require('./generate-classes');
const { log, logError } = require('./log');

const defaultOptions = {
  compilerOptions: {},
  exclude: ['node_modules'],
  fileExtension: undefined,
  log: false,
  match: [/\.jsx$/],
  path: ''
};

function PropTypesCSharpPlugin(options) {
  this.options = Object.assign({}, defaultOptions, options);
}

PropTypesCSharpPlugin.prototype.apply = function(compiler) {
  compiler.hooks.emit.tap(
    { name: 'PropTypesCSharpPlugin' },
    compilation => runThePlugin(compilation, this.options) // This callback runs every time the 'emit' webpack event occurs
  );
};

function runThePlugin(compilation, options) {
  const assertArray = (arr, name) =>
    Array.isArray(arr)
      ? true
      : logError(compilation, `Bad configuration: ${name} is not an array`);

  if (
    compilation.errors.length || // Abort if compilation has errors
    !assertArray(options.exclude, 'options.exclude') ||
    !assertArray(options.match, 'options.match')
  ) {
    return;
  }

  if (options.log) {
    process.stdout.write('[C# plugin]: Generating classes...\n');
  }

  const modulePaths = filterPaths(
    Array.from(compilation.fileDependencies),
    options.match,
    options.exclude
  );

  const result = generateClasses(modulePaths, options.compilerOptions);
  log(options, compilation, result);

  const outputPath = path.normalize(options.path);
  const fileExtension =
    options.fileExtension ||
    getFileExtension(options.compilerOptions.generator) ||
    'cs';

  if (!result.error) {
    result.classes.forEach(({ code, className }) => {
      if (code && className) {
        const fileName = `${className}.${fileExtension}`;
        const filePath = path.join(outputPath, fileName);
        const asset = { source: () => code, size: () => code.length };
        compilation.assets[filePath] = asset;
      }
    });
  }
}

PropTypesCSharpPlugin['default'] = PropTypesCSharpPlugin;
module.exports = PropTypesCSharpPlugin;
