const capitalize = require('../../capitalize');
const unknownToPascal = require('../../unknown-to-pascal');

// Returns the body of an enum definition as string
const enumProperties = (name, { argument, isRequired }) => {
  // Add empty element to start of list if not required
  const isStringsOnly = argument.every(
    element => typeof element === 'string' || typeof element.value === 'string'
  );
  const emptyElement = isStringsOnly ? '' : 0;

  const values = []
    .concat(!isRequired && !argument.includes(0) ? emptyElement : [])
    .concat(argument);

  return values
    .map((value, index) => {
      if (typeof value === 'number') {
        const propertyName = value === 0 ? 'None' : capitalize(name) + value;
        return `${propertyName} = ${index},`;
      }

      const propertyName = typeof value === 'string' ? value : value.key;
      const stringValue = typeof value === 'string' ? value : value.value;

      return `[EnumMember(Value = "${stringValue}")]\n${unknownToPascal(
        propertyName || 'None'
      )} = ${index},`;
    })
    .join('\n');
};

module.exports = enumProperties;
