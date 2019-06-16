const { get, mapIf, id, isString } = require('kompis');

const unknownToCamel = require('../unknown-to-camel');

// Returns the body of an enum definition as string
const enumProperties = (name, { children }) => {
  return (
    children
      .map(value => {
        const stringValue = mapIf(isString, id, get('value'))(value);
        const propertyName = mapIf(isString, id, get('key'))(value);

        return `${unknownToCamel(propertyName)}("${stringValue}")`;
      })
      .join(',\n') + ';'
  );
};

module.exports = enumProperties;
