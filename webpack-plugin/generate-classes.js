const fs = require('fs');

const generateClass = require('../lib');

const attemptGenerateClass = ({ baseClass, modulePath, namespace, indent }) => {
  try {
    const sourceCode = fs.readFileSync(modulePath, 'utf-8');
    const { code, className } = generateClass({
      baseClass,
      indent,
      namespace,
      sourceCode
    });

    return { code, className };
  } catch (error) {
    return {
      error: `\n${modulePath}\n${error.message}\n`
    };
  }
};

const generateClasses = ({ baseClass, indent, modulePaths, namespace }) => {
  const startTime = new Date().getTime();
  const classes = modulePaths.map(modulePath =>
    attemptGenerateClass({ baseClass, indent, modulePath, namespace })
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

// Hook for running in parallel with child_process. Expects the same options object as 'generateClasses' above.
process.on('message', options => {
  if (options.modulePaths) {
    process.send(generateClasses(options));
  }
});

module.exports = generateClasses;
