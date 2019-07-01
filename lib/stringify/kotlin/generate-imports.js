const dotNotation = require('../dot-notation');
const getReferences = require('../get-references');

module.exports = (propTypes, namespace) => {
  return getReferences(propTypes).map(name =>
    dotNotation(namespace, name, '*')
  );
};
