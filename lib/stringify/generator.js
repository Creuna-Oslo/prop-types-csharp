const capitalize = require('../utils/capitalize');
const unknownToPascal = require('../utils/unknown-to-pascal');

const property = (name, type) =>
  `public ${type} ${capitalize(name)} { get; set; }`;

const enumProperties = (name, { argument, isRequired }) => {
  // Add empty element to start of list if not required
  const values = []
    .concat(!isRequired && !argument.includes(0) ? '' : [])
    .concat(argument);
  return values
    .map((value, index) => {
      if (typeof value === 'number') {
        return `${capitalize(name)}${value} = ${index},`;
      }

      return `[EnumMember(Value ="${value}")]\n${unknownToPascal(
        value || 'None'
      )} = ${index},`;
    })
    .join('\n');
};

const unwrapArrays = (string = '', propType, componentName) => {
  if (propType.type === 'arrayOf') {
    return `IList<${unwrapArrays(string, propType.argument)}>`;
  }

  return propType.isNewDefinition
    ? `${componentName}_${capitalize(propType.type)}`
    : propType.type;
};

const generators = {
  default: (name, { isNewDefinition, type }, componentName) => {
    const typeName = isNewDefinition
      ? `${componentName}_${capitalize(type)}`
      : type;
    return property(name, typeName);
  },

  bool: name => property(name, 'bool'),
  float: name => property(name, 'float'),
  int: name => property(name, 'int'),
  string: name => property(name, 'string'),

  arrayOf: (name, propType, componentName) => {
    return property(name, unwrapArrays('', propType, componentName));
  },

  oneOf: (name, propType, componentName) => {
    const body = enumProperties(name, propType);
    return `public enum ${componentName}_${capitalize(name)}\n{\n${body}\n}`;
  },

  shape: (name, { argument }, componentName) => {
    const body = Object.entries(argument)
      .map(([name, propType]) => generate(name, propType, componentName))
      .join('\n');
    return `public class ${componentName}_${capitalize(name)}\n{\n${body}\n}`;
  }
};

const getGenerator = ({ type }) => generators[type] || generators.default;

function generate(name, propType, componentName) {
  return getGenerator(propType)(name, propType, componentName);
}

module.exports = generate;
