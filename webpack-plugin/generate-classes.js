const fs = require('fs');

const generateClass = require('../lib');

module.exports = function generateClasses(modulePaths, compilerOptions) {
  const startTime = new Date().getTime();
  const classes = modulePaths.map(attemptGenerateClass(compilerOptions));
  const duplicates = checkForDuplicates(classes, modulePaths);

  return {
    classes,
    duration: new Date().getTime() - startTime,
    error: duplicates.length
      ? `Found duplicate component names in:\n${duplicates.join('\n')}`
      : null
  };
};

function attemptGenerateClass(compilerOptions) {
  return modulePath => {
    try {
      const sourceCode = fs.readFileSync(modulePath, 'utf-8');
      return generateClass(sourceCode, compilerOptions);
    } catch (error) {
      return { error: `\n${modulePath}\n${error.message}\n` };
    }
  };
}

function checkForDuplicates(classes, modulePaths) {
  return classes.reduce((accum, { className }, index) => {
    const indexOfDuplicate = classes
      .slice(index + 1) // Ensures that the same pair of duplicates doesn't get reported twice
      .findIndex(c => c.className === className);

    if (className && indexOfDuplicate !== -1) {
      return accum.concat(
        `${className} (${modulePaths[index]})`,
        `${className} (${modulePaths[indexOfDuplicate + 1]})`
      );
    }

    return accum;
  }, []);
}
