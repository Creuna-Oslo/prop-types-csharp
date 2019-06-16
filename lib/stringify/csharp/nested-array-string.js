const parentPrefixedName = require('../parent-prefixed-name');

const nestedArrayString = (propType, listType = 'IList', accum = '') => {
  return propType.type === 'arrayOf'
    ? `${listType}<${nestedArrayString(propType.children, listType, accum)}>`
    : propType.parents
    ? parentPrefixedName(propType.type, propType.parents)
    : propType.type;
};

module.exports = nestedArrayString;
