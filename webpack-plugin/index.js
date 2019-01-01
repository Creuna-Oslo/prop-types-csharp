const { fork } = require('child_process');
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');

const filterPaths = require('./filter-paths');
const generateClasses = require('./generate-classes');
const log = require('./log');

function PropTypesCSharpPlugin(options) {
  this.options = Object.assign(
    {
      async: false, // Fallback is webpackConfig.mode === 'production'
      baseClass: '',
      exclude: ['node_modules'],
      indent: 2,
      log: false,
      match: [/\.jsx$/],
      namespace: '',
      path: ''
    },
    options
  );
}

// This function defines a lot of things before actually calling them.
// Reading this from the bottom is probably the easiest.
PropTypesCSharpPlugin.prototype.apply = function(compiler) {
  const isAsync = this.options.async;

  // In 'development' mode the class generation runs in parallel (using child_process.fork) in order to not degrade developer experience.
  const generateClassesAsync = isAsync
    ? fork(path.join(__dirname, './generate-classes'))
    : null;

  // Compiler 'emit' callback. Receives a webpack compilation object that holds information about compiled modules (and tons of other stuff) and lets us add our own assets and errors/warnings.
  const emit = compilation => {
    // Add to 'this' to be able to reference in log function when running in parallel
    this.compilation = compilation;
    this.outputPath = path.normalize(this.options.path);

    // Don't attempt class generation if compilation has errors
    if (compilation.errors.length) {
      return;
    }

    if (!Array.isArray(this.options.exclude)) {
      log(this.options, isAsync, compilation, {
        error: 'Bad configuration: options.exclude is not an array'
      });
      return;
    }

    if (!Array.isArray(this.options.match)) {
      log(this.options, isAsync, compilation, {
        error: 'Bad configuration: options.match is not an array'
      });
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

    const options = {
      baseClass: this.options.baseClass,
      indent: this.options.indent,
      namespace: this.options.namespace,
      parser: this.options.parser
    };

    if (!isAsync) {
      const result = generateClasses({ modulePaths, options });
      const { classes, error } = result;

      if (!error) {
        classes.forEach(({ code, className }) => {
          if (code && className) {
            compilation.assets[
              path.join(this.outputPath, `${className}.cs`)
            ] = {
              source: () => code,
              size: () => code.length
            };
          }
        });
      }

      log(this.options, isAsync, compilation, result);
    } else {
      // Run class generation in parallel
      generateClassesAsync.send({ modulePaths, options });
    }
  };

  // Attach async class generation
  if (isAsync) {
    generateClassesAsync.on('message', result => {
      const { classes, error } = result;

      if (!this.compilation) {
        return;
      }

      // Write files to disk since webpack dev server doesn't do so
      if (!error) {
        classes.forEach(({ code, className }) => {
          if (code && className) {
            const basePath = path.join(compiler.outputPath, this.outputPath);
            fsExtra.ensureDirSync(basePath);
            fs.writeFileSync(path.join(basePath, `${className}.cs`), code);
          }
        });
      }

      log(this.options, isAsync, this.compilation, result);
    });
  }

  // Attach to compiler 'emit' hook. Supports both Webpack > 4 syntax (compiler.hooks) and old syntax.
  if (compiler.hooks) {
    compiler.hooks.emit.tap({ name: 'PropTypesCSharpPlugin' }, emit);
  } else {
    compiler.plugin('emit', emit);
  }
};

PropTypesCSharpPlugin['default'] = PropTypesCSharpPlugin;
module.exports = PropTypesCSharpPlugin;
