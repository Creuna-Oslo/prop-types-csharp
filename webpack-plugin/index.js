const { fork } = require('child_process');
const fs = require('fs');
const path = require('path');

const generateClasses = require('./generate-classes');
const log = require('./log');

function PropTypesCSharpPlugin(options) {
  this.options = Object.assign(
    {
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
  const hasDevServer = Boolean(compiler.options.devServer);
  const runSync = compiler.options.mode === 'production' || !hasDevServer;

  // In 'development' mode the class generation runs in parallel (using child_process.fork) in order to not degrade developer experience.
  const generateClassesAsync = runSync
    ? null
    : fork(path.join(__dirname, './generate-classes'));

  // Compiler 'emit' callback. Receives a webpack compilation object that holds information about compiled modules (and tons of other stuff) and lets us add our own assets and errors/warnings.
  const emit = compilation => {
    // Add to 'this' to be able to reference in log function when running in parallel
    this.compilation = compilation;
    this.outputPath = path.normalize(this.options.path);

    // Don't attempt class generation if compilation has errors
    if (compilation.errors.length) {
      return;
    }

    if (this.options.log) {
      process.stdout.write('[C# plugin]: Generating classes...\n');
    }

    // Filter modules according to options. 'module.resource' is the path to the source file of a compiled module
    const modulePaths = Array.from(compilation.fileDependencies).filter(
      modulePath => {
        const { exclude, match } = this.options;
        return (
          modulePath &&
          match.some(pattern => modulePath.match(pattern)) &&
          exclude.every(pattern => !modulePath.match(pattern))
        );
      }
    );

    const generateClassesOptions = {
      baseClass: this.options.baseClass,
      indent: this.options.indent,
      modulePaths,
      namespace: this.options.namespace
    };

    if (runSync) {
      const result = generateClasses(generateClassesOptions);
      const { classes, error } = result;

      if (!error) {
        classes.forEach(({ code, componentName }) => {
          if (code && componentName) {
            compilation.assets[
              path.join(this.outputPath, `${componentName}.cs`)
            ] = {
              source: () => code,
              size: () => code.length
            };
          }
        });
      }

      log(this.options, runSync, compilation, result);
    } else {
      // Run class generation in parallel
      generateClassesAsync.send(generateClassesOptions);
    }
  };

  // Attach parallel class generation for development build
  if (!runSync) {
    generateClassesAsync.on('message', result => {
      const { classes, error } = result;

      if (!this.compilation) {
        return;
      }

      // Since webpack dev server doesn't write files to disk, this is done manually here.
      if (!error) {
        classes.forEach(({ code, componentName }) => {
          if (code && componentName) {
            const basePath = path.join(compiler.outputPath, this.outputPath);
            fs.writeFileSync(path.join(basePath, `${componentName}.cs`), code);
          }
        });
      }

      log(this.options, runSync, this.compilation, result);
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
