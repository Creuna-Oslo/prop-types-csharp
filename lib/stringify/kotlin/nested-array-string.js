const parentPrefixedName = require('../parent-prefixed-name');
const mapBasicType = require('./map-basic-type');

const nestedArrayString = (propType, listType = 'Array', accum = '') => {
  return propType.type === 'arrayOf'
    ? `${listType}<${nestedArrayString(propType.children, listType, accum)}>`
    : propType.parents
    ? parentPrefixedName(propType.type, propType.parents)
    : mapBasicType(propType.type);
};

module.exports = nestedArrayString;
