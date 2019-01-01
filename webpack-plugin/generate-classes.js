const fs = require('fs');

const generateClass = require('../lib');

const attemptGenerateClass = (modulePath, options) => {
  try {
    const sourceCode = fs.readFileSync(modulePath, 'utf-8');
    const { code, className } = generateClass(
      Object.assign({}, options, { sourceCode })
    );

    return { code, className };
  } catch (error) {
    return {
      error: `\n${modulePath}\n${error.message}\n`
    };
  }
};

const generateClasses = ({ modulePaths, options }) => {
  const startTime = new Date().getTime();
  const classes = modulePaths.map(modulePath =>
    attemptGenerateClass(modulePath, options)
  );
  const duplicates = classes.reduce((accum, { className }, index) => {
    if (className) {
      const duplicateIndex = classes
        .slice(index + 1)
        .findIndex(c => c.className === className);

      if (duplicateIndex !== -1) {
        return accum.concat(
          `${className} (${modulePaths[index]})`,
          `${className} (${modulePaths[duplicateIndex + 1]})`
        );
      }
    }

    return accum;
  }, []);

  return {
    classes,
    duration: new Date().getTime() - startTime,
    error: duplicates.length
      ? `Found duplicate component names in:${duplicates.reduce(
          (accum, path) => `${accum}\n${path}`,
          ''
        )}`
      : null
  };
};

// Hook for running in parallel with child_process. Expects the same arguments as 'generateClasses' above.
process.on('message', ({ modulePaths, options }) => {
  if (modulePaths) {
    process.send(generateClasses({ modulePaths, options }));
  }
});

module.exports = generateClasses;
