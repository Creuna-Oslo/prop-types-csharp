const fs = require('fs');

const generateClass = require('../lib');

const attemptGenerateClass = ({ modulePath, namespace, indent }) => {
  try {
    const sourceCode = fs.readFileSync(modulePath, 'utf-8');
    const { code, componentName } = generateClass({
      indent,
      namespace,
      sourceCode
    });

    return { code, componentName };
  } catch (error) {
    return {
      error: `\n${modulePath}\n${error.message}\n`
    };
  }
};

const generateClasses = ({ indent, modulePaths, namespace }) => {
  const startTime = new Date().getTime();
  const classes = modulePaths.map(modulePath =>
    attemptGenerateClass({ indent, modulePath, namespace })
  );
  const duplicates = classes.reduce((accum, { componentName }, index) => {
    if (componentName) {
      const duplicateIndex = classes
        .slice(index + 1)
        .findIndex(c => c.componentName === componentName);

      if (duplicateIndex !== -1) {
        return accum.concat(
          `${componentName} (${modulePaths[index]})`,
          `${componentName} (${modulePaths[duplicateIndex + 1]})`
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

// Hook for running in parallel with child_process
process.on('message', ({ indent, modulePaths, namespace }) => {
  if (modulePaths) {
    process.send(generateClasses({ indent, modulePaths, namespace }));
  }
});

module.exports = generateClasses;
