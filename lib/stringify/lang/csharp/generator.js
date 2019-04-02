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
  other: (name, propType) => {
    const typeName = propType.parents
      ? parentPrefixedName(propType.type, propType.parents)
      : propType.type;
    return property(name, propType, typeName);
  },

  bool: simpleProperty('bool'),
  float: simpleProperty('float'),
  int: simpleProperty('int'),
  string: simpleProperty('string'),

  arrayOf: (name, propType) =>
    property(name, propType, nestedArrayString(propType)),

  oneOf: (name, propType) => {
    const body = enumProperties(name, propType);
    return `public enum ${parentPrefixedName(
      name,
      propType.parents
    )}\n{\n${body}\n}`;
  },

  shape: (name, propType, baseClass) => {
    const { children } = propType;
    const properties = Object.entries(children)
      .map(([name, type]) => generateClass(name, type))
      .join('\n');
    const body = properties.length ? `${properties}\n` : '';
    const className = propType.parents
      ? parentPrefixedName(name, propType.parents)
      : capitalize(name);

    // NOTE: If the class doesn't have parents, it is the main component class, and should extend the baseClass if any.
    const isComponentClass = !propType.parents;
    const classExtends =
      isComponentClass && baseClass && baseClass !== className
        ? ` : ${baseClass}`
        : '';
    return `public class ${className}${classExtends}\n{\n${body}}`;
  }
};

const getGenerator = ({ type }) => generators[type] || generators.other;

function generateClass(name, propType, baseClass) {
  return getGenerator(propType)(name, propType, baseClass);
}

const generateClassExtends = (className, otherClassName) =>
  `public class ${className} : ${otherClassName}\n{\n}`;

module.exports = { generateClass, generateClassExtends };
