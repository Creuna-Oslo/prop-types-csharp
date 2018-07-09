const fs = require('fs');

const transformPropTypes = require('../transforms/transform-prop-types');

const attemptGenerateClass = modulePath => {
  try {
    const sourceCode = fs.readFileSync(modulePath, 'utf-8');
    const { code, componentName } = transformPropTypes({
      sourceCode
    });

    return { code, componentName };
  } catch (error) {
    return {
      error: `C# class generator plugin\n${modulePath}\n${error.message}\n`
    };
  }
};

const generateClasses = modulePaths => {
  const startTime = new Date().getTime();
  const classes = modulePaths.map(modulePath =>
    attemptGenerateClass(modulePath)
  );

  return {
    classes,
    duration: new Date().getTime() - startTime
  };
};

// Hook for running in parallel with child_process
process.on('message', ({ modulePaths }) => {
  if (modulePaths) {
    process.send(generateClasses(modulePaths));
  }
});

module.exports = generateClasses;
