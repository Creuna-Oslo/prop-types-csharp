const { fork } = require('child_process');
const path = require('path');

const generateClasses = require('./generate-classes');

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
  const production = compiler.options.mode === 'production';

  const logError = error => {
    const errorMessage = `C# class generator plugin\n${error}`;

    if (production) {
      this.compilation.errors.push(errorMessage);
      return;
    }

    // Since class generation is running in parallel in dev mode, pushing warnings to the compilation does not output anything to the shell (it does show in the browser though). Double logging fixes this.
    this.compilation.warnings.push(errorMessage);
    process.stdout.write(`\nWARNING in ${errorMessage}\n`);
  };

  // Writes errors/warnings and status messages (if enabled)
  const log = ({ classes, duration, error }) => {
    if (error) {
      logError(error);
    }

    const numberOfClasses = classes
      .map(({ error, code, componentName }) => {
        if (error) {
          logError(error);
          return false;
        }

        return !!code && !!componentName;
      })
      .reduce((accum, didGenerate) => accum + (didGenerate ? 1 : 0), 0);

    if (this.options.log) {
      process.stdout.write(
        `[C# plugin]: Generated ${numberOfClasses} classes in ${duration}ms\n`
      );
    }
  };

  // In 'development' mode the class generation runs in parallel (using child_process.fork) in order to not degrade developer experience.
  const generateClassesParallel = production
    ? null
    : fork(path.join(__dirname, './generate-classes'));

  // Compiler 'emit' callback. Receives a webpack compilation object that holds information about compiled modules (and tons of other stuff) and lets us add our own assets and errors/warnings.
  const emit = compilation => {
    // Add to 'this' to be able to reference in log function when running in parallel
    this.compilation = compilation;

    if (this.options.log) {
      process.stdout.write('[C# plugin]: Generating classes...\n');
    }

    // Filter modules according to options. 'module.resource' is the path to the source file of a compiled module
    const modulePaths = compilation.modules
      .map(module => module.resource)
      .filter(modulePath => {
        const { exclude, match } = this.options;
        return (
          modulePath &&
          match.some(pattern => modulePath.match(pattern)) &&
          exclude.every(pattern => !modulePath.match(pattern))
        );
      });

    if (production) {
      const outputPath = path.normalize(this.options.path);
      const { classes, duration, error } = generateClasses({
        baseClass: this.options.baseClass,
        indent: this.options.indent,
        modulePaths,
        namespace: this.options.namespace
      });

      if (!error) {
        classes.forEach(({ code, componentName }) => {
          if (code && componentName) {
            compilation.assets[path.join(outputPath, `${componentName}.cs`)] = {
              source: () => code,
              size: () => code.length
            };
          }
        });
      }

      log({ classes, duration, error });
    } else {
      // Run class generation in parallel
      generateClassesParallel.send({
        baseClass: this.options.baseClass,
        indent: this.options.indent,
        modulePaths,
        namespace: this.options.namespace
      });
    }
  };

  // Attach logging for development version
  if (!production) {
    generateClassesParallel.on('message', log);
  }

  // Attach to compiler 'emit' hook
  if (compiler.hooks) {
    compiler.hooks.emit.tap({ name: 'PropTypesCSharpPlugin' }, emit);
  } else {
    compiler.plugin('emit', emit);
  }
};

PropTypesCSharpPlugin['default'] = PropTypesCSharpPlugin;
module.exports = PropTypesCSharpPlugin;
