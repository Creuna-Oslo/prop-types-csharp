const capitalize = require('../../capitalize');
const unknownToPascal = require('../../unknown-to-pascal');

// Returns the body of an enum definition as string
const enumProperties = (name, { argument, isRequired }) => {
  // Add empty element to start of list if not required
  const isStringsOnly = argument.every(element => typeof element === 'string');
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

      return `[EnumMember(Value = "${value}")]\n${unknownToPascal(
        value || 'None'
      )} = ${index},`;
    })
    .join('\n');
};

module.exports = enumProperties;
