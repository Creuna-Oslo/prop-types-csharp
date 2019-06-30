const path = require('path');

const filterPaths = require('./filter-paths');
const getFileExtension = require('./get-file-extension');
const generateClasses = require('./generate-classes');
const { log, logError } = require('./log');

function PropTypesCSharpPlugin(options) {
  this.options = Object.assign(
    {
      compilerOptions: {},
      exclude: ['node_modules'],
      fileExtension: undefined,
      log: false,
      match: [/\.jsx$/],
      path: ''
    },
    options
  );
}

const badArrayOption = key =>
  `Bad configuration: options.${key} is not an array`;

// This function defines a lot of things before actually calling them.
// Reading this from the bottom is probably the easiest.
PropTypesCSharpPlugin.prototype.apply = function(compiler) {
  const fileExtension =
    this.options.fileExtension ||
    getFileExtension(this.options.compilerOptions.generator) ||
    'cs';

  // Compiler 'emit' callback. Receives a webpack compilation object that holds information about compiled modules (and tons of other stuff) and lets us add our own assets and errors/warnings.
  const emit = compilation => {
    const assertArray = (arr, message) =>
      Array.isArray(arr) ? true : logError(compilation, message);

    if (
      compilation.errors.length || // Abort if compilation has errors
      !assertArray(this.options.exclude, badArrayOption('exclude')) ||
      !assertArray(this.options.match, badArrayOption('match'))
    ) {
      return;
    }

    if (this.options.log) {
      process.stdout.write('[C# plugin]: Generating classes...\n');
    }

    const modulePaths = filterPaths(
      Array.from(compilation.fileDependencies),
      this.options.match,
      this.options.exclude
    );

    const outputPath = path.normalize(this.options.path);
    const result = generateClasses(modulePaths, this.options.compilerOptions);
    log(this.options, compilation, result);

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
  };

  if (compiler.hooks) {
    // Webpack >= 4
    compiler.hooks.emit.tap({ name: 'PropTypesCSharpPlugin' }, emit);
  } else {
    // Webpack < 4
    compiler.plugin('emit', emit);
  }
};

PropTypesCSharpPlugin['default'] = PropTypesCSharpPlugin;
module.exports = PropTypesCSharpPlugin;
