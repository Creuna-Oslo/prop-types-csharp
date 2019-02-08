const logError = (isAsync, compilation, error) => {
  const errorMessage = `C# class generator plugin\n${error}`;

  compilation.errors.push(errorMessage);

  if (!isAsync) {
    return;
  }

  // Since class generation is running async when using webpack dev server, pushing warnings to the compilation does not output anything to the shell (it does show in the browser though). Writing to process.stdout manually fixes this.
  process.stdout.write(`\nERROR in ${errorMessage}\n`);
};

// Writes errors/warnings and status messages (if enabled)
const log = (options, isAsync, compilation, { classes, duration, error }) => {
  const errorLogger = logError.bind(null, isAsync, compilation);

  if (error) errorLogger(error);

  if (!classes || !duration) return;

  classes.forEach(({ error }) => error && errorLogger(error));

  const numberOfClasses = classes.reduce(
    (accum, { error, code, className }) =>
      accum + (!error && !!code && !!className ? 1 : 0),
    0
  );

  if (options.log) {
    process.stdout.write(
      `[C# plugin]: Generated ${numberOfClasses} classes in ${duration}ms\n`
    );
  }
};

module.exports = { log, logError };
