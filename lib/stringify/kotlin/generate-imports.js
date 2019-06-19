const dotNotation = require('../dot-notation');
const getNonBasicTypes = require('../get-non-basic-types');

module.exports = (propTypes, namespace) => {
  return getNonBasicTypes(propTypes).map(typeName =>
    dotNotation(namespace, typeName, '*')
  );
};
