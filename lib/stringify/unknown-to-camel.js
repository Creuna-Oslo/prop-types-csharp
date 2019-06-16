const unknownToPascal = require('./unknown-to-pascal');

module.exports = (str = '') => {
  if (str.length === 0) {
    return str;
  }

  const pascalString = unknownToPascal(str);
  return (
    pascalString[0].toLowerCase() + pascalString.slice(1, pascalString.length)
  );
};
