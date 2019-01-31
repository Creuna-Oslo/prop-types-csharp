const parentPrefixedName = require('../../parent-prefixed-name');

const nestedArrayString = (propType, parent, accum = '') => {
  return propType.type === 'arrayOf'
    ? `IList<${nestedArrayString(propType.argument, parent, accum)}>`
    : propType.hasClassDefinition
      ? parentPrefixedName(propType.type, parent)
      : propType.type;
};

module.exports = nestedArrayString;
