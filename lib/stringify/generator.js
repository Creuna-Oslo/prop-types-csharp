const capitalize = require('./capitalize');

const enumProperties = require('./enum-properties');

const property = (name, { isRequired }, type) =>
  `${isRequired ? '[Required]\n' : ''}public ${type} ${capitalize(
    name
  )} { get; set; }`;

const parentPrefixedName = (name, parent, accum = []) => {
  if (!parent.parent) {
    const nestedPrefixes = accum
      .map(prefix => capitalize(prefix) + '_')
      .reverse()
      .join('');
    return `${parent.name}_${nestedPrefixes}${capitalize(name)}`;
  }

  return parentPrefixedName(name, parent.parent, [...accum, parent.name]);
};

const unwrapArrays = (propType, parent, accum = '') => {
  if (propType.type === 'arrayOf') {
    return `IList<${unwrapArrays(propType.argument, parent, accum)}>`;
  }

  return propType.hasClassDefinition
    ? parentPrefixedName(propType.type, parent)
    : propType.type;
};

const generators = {
  default: (name, propType, parent) => {
    const typeName = propType.hasClassDefinition
      ? parentPrefixedName(propType.type, parent)
      : propType.type;
    return property(name, propType, typeName);
  },

  bool: (name, propType) => property(name, propType, 'bool'),
  float: (name, propType) => property(name, propType, 'float'),
  int: (name, propType) => property(name, propType, 'int'),
  string: (name, propType) => property(name, propType, 'string'),

  arrayOf: (name, propType, parent) => {
    return property(name, propType, unwrapArrays(propType, parent));
  },

  oneOf: (name, propType, parent) => {
    const body = enumProperties(name, propType);
    return `public enum ${parentPrefixedName(name, parent)}\n{\n${body}\n}`;
  },

  shape: (name, propType, parent, baseClass) => {
    const { argument, isComponentClass } = propType;
    const body = Object.entries(argument)
      .map(([propName, propType]) =>
        // When generating children classes, the 'parent' argument needs to be extended with the current child class name or else it won't be included when building parent prefixed names.
        generateClass(
          propName,
          propType,
          isComponentClass ? parent : { name, parent }
        )
      )
      .join('\n');
    const className = isComponentClass
      ? capitalize(name)
      : parentPrefixedName(name, parent);

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
