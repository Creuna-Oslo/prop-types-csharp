const { get, mapIf, id, isString } = require('kompis');

// Returns a union type as string
module.exports = ({ children }) =>
  children
    .map(value => {
      const stringValue = mapIf(isString, id, get('value'))(value);
      return `"${stringValue}"`;
    })
    .join(' | ');
