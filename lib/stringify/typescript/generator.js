const unionProperties = require('./union-properties');
const parentPrefixedName = require('../parent-prefixed-name');
const primitiveTypes = require('../../primitive-types');

// Override all primitive types to 'number' and then add bool and string. Because of all of the possible number types, this was the easiest way.
const primitiveGenerators = Object.assign(
  primitiveTypes.reduce(
    (accum, type) => Object.assign(accum, { [type]: () => 'number' }),
    {}
  ),
  {
    bool: () => 'boolean',
    string: () => 'string'
  }
);

const generators = Object.assign(primitiveGenerators, {
  ref: propType => {
    const typeName = propType.parents
      ? parentPrefixedName(propType.ref, propType.parents)
      : propType.ref;
    return typeName;
  },

  arrayOf: propType => `[${generateType(propType.children)}]`,

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
});

function property(name, { isRequired }, type) {
  return `${name}${isRequired ? '' : '?'}: ${type}`;
}

function generateType(propType) {
  const generator = generators[propType.type];
  if (typeof generator !== 'function') {
    throw new Error(`Type '${propType.type}' is not supported.`);
  }
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
