const parentPrefixedName = require('../../parent-prefixed-name');

const nestedArrayString = (propType, parent, accum = '') => {
  return propType.type === 'arrayOf'
    ? `IList<${nestedArrayString(propType.children, parent, accum)}>`
    : propType.hasClassDefinition
      ? parentPrefixedName(propType.type, parent)
      : propType.type;
};

module.exports = nestedArrayString;
