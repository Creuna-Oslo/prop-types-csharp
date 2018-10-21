const parentPrefixedName = require('./parent-prefixed-name');

const nestedArrayString = (propType, parent, accum = '') => {
  if (propType.type === 'arrayOf') {
    return `IList<${nestedArrayString(propType.argument, parent, accum)}>`;
  }

  return propType.hasClassDefinition
    ? parentPrefixedName(propType.type, parent)
    : propType.type;
};

module.exports = nestedArrayString;
