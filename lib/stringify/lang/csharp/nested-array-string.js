const parentPrefixedName = require('../../parent-prefixed-name');

const nestedArrayString = (propType, accum = '') => {
  return propType.type === 'arrayOf'
    ? `IList<${nestedArrayString(propType.children, accum)}>`
    : propType.parents
      ? parentPrefixedName(propType.type, propType.parents)
      : propType.type;
};

module.exports = nestedArrayString;
