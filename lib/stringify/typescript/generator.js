const unionProperties = require('./union-properties');
const nestedArrayString = require('./nested-array-string');
const parentPrefixedName = require('../parent-prefixed-name');

const generators = {
  // This handles anything that's not a propType, like { type: 'OtherComponentName' }
  other: propType => {
    const typeName = propType.parents
      ? parentPrefixedName(propType.type, propType.parents)
      : propType.type;
    return typeName;
  },

  bool: () => 'boolean',
  float: () => 'number',
  int: () => 'number',
  string: () => 'string',

  arrayOf: propType => nestedArrayString(propType, generateType),

  oneOf: unionProperties,

  objectOf: propType => {
    const valueType = generateType(propType.children);
    return `{\n[key: string]: ${valueType}\n}`;
  },

  shape: propType => {
    const { children } = propType;
    const properties = Object.entries(children)
      .map(([name, type]) => property(name, type, generateType(type, '')))
      .join(',\n');
    const body = properties.length ? `${properties}\n` : '';

    return `{\n${body}}`;
  }
};

function property(name, { isRequired }, type) {
  return `${name}${isRequired ? '' : '?'}: ${type}`;
}

function generateType(propType) {
  const generator = generators[propType.type] || generators.other;
  return generator(propType);
}

function generateClass(name, propTypes, baseClass) {
  const properties = Object.entries(propTypes)
    .map(([propName, propType]) => {
      const typeString = generateType(propType);
      return property(propName, propType, typeString);
    })
    .join(',\n');
  const extendsString = baseClass ? ` extends ${baseClass}` : '';

  return `export interface ${name}${extendsString} {\n${properties}\n}`;
}

const generateClassExtends = (className, otherClassName) =>
  `export interface ${className} extends ${otherClassName} {};`;

module.exports = { generateClass, generateClassExtends };
