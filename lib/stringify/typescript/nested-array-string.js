const nestedArrayString = (propType, generateType, accum = '') =>
  propType.type === 'arrayOf'
    ? `[${nestedArrayString(propType.children, generateType, accum)}]`
    : generateType(propType);

module.exports = nestedArrayString;
