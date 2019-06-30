const logError = (compilation, error) => {
  compilation.errors.push(`C# class generator plugin\n${error}`);
};

// Writes errors/warnings and status messages (if enabled)
const log = (options, compilation, { classes, duration, error }) => {
  const errorLogger = logError.bind(null, compilation);

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
