const { generators } = require('../index.js');

const fileExtensions = {
  [generators.csharp.name]: 'cs',
  [generators.kotlin.name]: 'kt',
  [generators.typescript.name]: 'ts'
};

module.exports = generator => {
  if (typeof generator !== 'function' || !generator.name) {
    return;
  }

  return fileExtensions[generator.name];
};
