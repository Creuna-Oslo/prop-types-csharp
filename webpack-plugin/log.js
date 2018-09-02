const logError = (isSync, compilation, error) => {
  const errorMessage = `C# class generator plugin\n${error}`;

  compilation.errors.push(errorMessage);

  if (isSync) {
    return;
  }

  // Since class generation is running async when using webpack dev server, pushing warnings to the compilation does not output anything to the shell (it does show in the browser though). Writing to process.stdout manually fixes this.
  process.stdout.write(`\nERROR in ${errorMessage}\n`);
};

// Writes errors/warnings and status messages (if enabled)
const log = (options, isSync, compilation, { classes, duration, error }) => {
  const errorLogger = logError.bind(null, isSync, compilation);

  if (error) {
    errorLogger(error);
  }

  const numberOfClasses = classes
    .map(({ error, code, componentName }) => {
      if (error) {
        errorLogger(error);
        return false;
      }

      return !!code && !!componentName;
    })
    .reduce((accum, didGenerate) => accum + (didGenerate ? 1 : 0), 0);

  if (options.log) {
    process.stdout.write(
      `[C# plugin]: Generated ${numberOfClasses} classes in ${duration}ms\n`
    );
  }
};

module.exports = log;
