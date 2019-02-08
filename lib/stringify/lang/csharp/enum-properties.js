const { get, mapIf, id, isString } = require('kompis');

const capitalize = require('../../capitalize');
const unknownToPascal = require('../../unknown-to-pascal');

// Returns the body of an enum definition as string
const enumProperties = (name, { children, isRequired }) => {
  // Add empty element to start of list if not required
  const isStringsOnly = children.every(
    element => typeof element === 'string' || typeof element.value === 'string'
  );
  const emptyElement = isStringsOnly ? '' : 0;

  const values = []
    .concat(!isRequired && !children.includes(0) ? emptyElement : [])
    .concat(children);

  return values
    .map((value, index) => {
      if (typeof value === 'number') {
        const propertyName = value === 0 ? 'None' : capitalize(name) + value;
        return `${propertyName} = ${index},`;
      }

      const stringValue = mapIf(isString, id, get('value'))(value);
      const propertyName =
        unknownToPascal(mapIf(isString, id, get('key'))(value)) || 'None';

      return `[EnumMember(Value = "${stringValue}")]\n${propertyName} = ${index},`;
    })
    .join('\n');
};

module.exports = enumProperties;
