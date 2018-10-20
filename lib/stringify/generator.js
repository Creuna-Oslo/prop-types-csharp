const capitalize = require('./capitalize');

const enumProperties = require('./enum-properties');

const property = (name, { isRequired }, type) =>
  `${isRequired ? '[Required]\n' : ''}public ${type} ${capitalize(
    name
  )} { get; set; }`;

const unwrapArrays = (string = '', propType, parent) => {
  if (propType.type === 'arrayOf') {
    return `IList<${unwrapArrays(string, propType.argument, parent)}>`;
  }

  return propType.hasClassDefinition
    ? `${parent.name}_${capitalize(propType.type)}`
    : propType.type;
};

const generators = {
  default: (name, propType, parent) => {
    const typeName = propType.hasClassDefinition
      ? `${parent.name}_${capitalize(propType.type)}`
      : propType.type;
    return property(name, propType, typeName);
  },

  bool: (name, propType) => property(name, propType, 'bool'),
  float: (name, propType) => property(name, propType, 'float'),
  int: (name, propType) => property(name, propType, 'int'),
  string: (name, propType) => property(name, propType, 'string'),

  arrayOf: (name, propType, parent) => {
    return property(name, propType, unwrapArrays('', propType, parent));
  },

  oneOf: (name, propType, parent) => {
    const body = enumProperties(name, propType);
    return `public enum ${parent.name}_${capitalize(name)}\n{\n${body}\n}`;
  },

  shape: (name, { argument, isComponentClass }, parent, baseClass) => {
    const body = Object.entries(argument)
      .map(([name, propType]) => generateClass(name, propType, parent))
      .join('\n');
    const className =
      parent && !isComponentClass
        ? `${parent.name}_${capitalize(name)}`
        : capitalize(name);
    // If there's no 'parent', this is the component class:
    const classExtends = isComponentClass && baseClass ? ` : ${baseClass}` : '';
    return `public class ${className}${classExtends}\n{\n${body}\n}`;
  }
};

const getGenerator = ({ type }) => generators[type] || generators.default;

function generateClass(name, properties, parent, baseClass) {
  return getGenerator(properties)(name, properties, parent, baseClass);
}

const generateClassExtends = (componentName, otherComponentName) =>
  `public class ${componentName} : ${otherComponentName}\n{\n}`;

module.exports = { generateClass, generateClassExtends };
