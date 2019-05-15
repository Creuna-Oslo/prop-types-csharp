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
  other: (name, propType, _baseClass, instantiate) => {
    const typeName = propType.parents
      ? parentPrefixedName(propType.type, propType.parents)
      : propType.type;
    return (
      property(name, propType, typeName) +
      (instantiate ? ` = new ${typeName}();` : '')
    );
  },

  bool: simpleProperty('bool'),
  float: simpleProperty('float'),
  int: simpleProperty('int'),
  string: simpleProperty('string'),

  arrayOf: (name, propType, _baseClass, instantiate) =>
    property(name, propType, nestedArrayString(propType, 'IList')) +
    (instantiate ? ` = new ${nestedArrayString(propType, 'List')}();` : ''),

  oneOf: (name, propType) => {
    const body = enumProperties(name, propType);
    return `public enum ${parentPrefixedName(
      name,
      propType.parents
    )}\n{\n${body}\n}`;
  },

  objectOf: (name, propType, _baseClass, instantiate) => {
    const valueType = propType.children.parents
      ? parentPrefixedName(propType.children.type, propType.children.parents)
      : propType.children.type;
    const dictString = `Dictionary<string, ${valueType}>`;
    return (
      property(name, propType, `I${dictString}`) +
      (instantiate ? ` = new ${dictString}();` : '')
    );
  },

  shape: (name, propType, baseClass, instantiateProperties) => {
    const { children } = propType;
    const properties = Object.entries(children)
      .map(([name, type]) =>
        generateClass(name, type, '', instantiateProperties)
      )
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

const getGenerator = typeName => generators[typeName] || generators.other;

function generateClass(name, propType, baseClass, instantiateProperties) {
  const generator = getGenerator(propType.type);
  return generator(name, propType, baseClass, instantiateProperties);
}

const generateClassExtends = (className, otherClassName) =>
  `public class ${className} : ${otherClassName}\n{\n}`;

module.exports = { generateClass, generateClassExtends };
