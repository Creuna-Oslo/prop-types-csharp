const capitalize = require('../../capitalize');

const enumProperties = require('./enum-properties');
const nestedArrayString = require('./nested-array-string');
const parentPrefixedName = require('../../parent-prefixed-name');

const property = (name, { isRequired }, type) =>
  `${isRequired ? '[Required]\n' : ''}` +
  `public ${type} ${capitalize(name)} { get; set; }`;

const simpleProperty = type => (name, propType) =>
  property(name, propType, type);

const generators = {
  // This handles anything that's not a propType, like { type: 'OtherComponentName' } or a reference to a class defined in the currently generated file
  other: (name, propType, parent) => {
    const typeName = propType.hasClassDefinition
      ? parentPrefixedName(propType.type, parent)
      : propType.type;
    return property(name, propType, typeName);
  },

  bool: simpleProperty('bool'),
  float: simpleProperty('float'),
  int: simpleProperty('int'),
  string: simpleProperty('string'),

  arrayOf: (name, propType, parent) =>
    property(name, propType, nestedArrayString(propType, parent)),

  oneOf: (name, propType, parent) => {
    const body = enumProperties(name, propType);
    return `public enum ${parentPrefixedName(name, parent)}\n{\n${body}\n}`;
  },

  shape: (name, propType, parent, baseClass) => {
    const { argument, isComponentClass } = propType;
    // When generating children classes, the 'parent' argument needs to be extended with the current child class name or else it won't be included when building parent prefixed names.
    const propertyParent = isComponentClass ? parent : { name, parent };
    const properties = Object.entries(argument)
      .map(([name, type]) => generateClass(name, type, propertyParent))
      .join('\n');
    const body = properties.length ? `${properties}\n` : '';
    const className = isComponentClass
      ? capitalize(name)
      : parentPrefixedName(name, parent);

    const classExtends =
      isComponentClass && baseClass && baseClass !== className
        ? ` : ${baseClass}`
        : '';
    return `public class ${className}${classExtends}\n{\n${body}}`;
  }
};

const getGenerator = ({ type }) => generators[type] || generators.other;

function generateClass(name, propType, parent, baseClass) {
  return getGenerator(propType)(name, propType, parent, baseClass);
}

const generateClassExtends = (className, otherClassName) =>
  `public class ${className} : ${otherClassName}\n{\n}`;

module.exports = { generateClass, generateClassExtends };
