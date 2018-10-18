const capitalize = require('./capitalize');

const enumProperties = require('./enum-properties');

const property = (name, { isRequired }, type) =>
  `${isRequired ? '[Required]\n' : ''}public ${type} ${capitalize(
    name
  )} { get; set; }`;

const unwrapArrays = (string = '', propType, componentName) => {
  if (propType.type === 'arrayOf') {
    return `IList<${unwrapArrays(string, propType.argument, componentName)}>`;
  }

  return propType.isNewDefinition
    ? `${componentName}_${capitalize(propType.type)}`
    : propType.type;
};

const generators = {
  default: (name, propType, componentName) => {
    const typeName = propType.isNewDefinition
      ? `${componentName}_${capitalize(propType.type)}`
      : propType.type;
    return property(name, propType, typeName);
  },

  bool: (name, propType) => property(name, propType, 'bool'),
  float: (name, propType) => property(name, propType, 'float'),
  int: (name, propType) => property(name, propType, 'int'),
  string: (name, propType) => property(name, propType, 'string'),

  arrayOf: (name, propType, componentName) => {
    return property(name, propType, unwrapArrays('', propType, componentName));
  },

  oneOf: (name, propType, componentName) => {
    const body = enumProperties(name, propType);
    return `public enum ${componentName}_${capitalize(name)}\n{\n${body}\n}`;
  },

  shape: (name, { argument, isComponentClass }, componentName, baseClass) => {
    const body = Object.entries(argument)
      .map(([name, propType]) => generateClass(name, propType, componentName))
      .join('\n');
    const className = isComponentClass
      ? componentName
      : `${componentName}_${capitalize(name)}`;
    const classExtends = isComponentClass && baseClass ? ` : ${baseClass}` : '';
    return `public class ${className}${classExtends}\n{\n${body}\n}`;
  }
};

const getGenerator = ({ type }) => generators[type] || generators.default;

function generateClass(name, propType, componentName, baseClass) {
  return getGenerator(propType)(name, propType, componentName, baseClass);
}

const generateClassExtends = (componentName, otherComponentName) =>
  `public class ${componentName} : ${otherComponentName}\n{\n}`;

module.exports = { generateClass, generateClassExtends };
