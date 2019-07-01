const capitalize = require('../capitalize');
const enumProperties = require('./enum-properties');
const parentPrefixedName = require('../parent-prefixed-name');
const primitiveTypes = require('../../primitive-types');

const typeNames = Object.assign(
  // NOTE: This is where stuff like 'bool', 'string' etc goes
  primitiveTypes.reduce(
    (accum, typeName) => Object.assign(accum, { [typeName]: () => typeName }),
    {}
  ),
  {
    ref: propType =>
      propType.parents
        ? parentPrefixedName(propType.ref, propType.parents)
        : propType.ref,
    arrayOf: propType => {
      const childGenerator = typeNames[propType.children.type];
      return `IList<${childGenerator(propType.children)}>`;
    },
    objectOf: propType => {
      const childGenerator = typeNames[propType.children.type];
      return `IDictionary<string, ${childGenerator(propType.children)}>`;
    }
  }
);

const generateProperty = (name, propType) => {
  const generator = typeNames[propType.type];
  if (typeof generator !== 'function') {
    throw new Error(`Type '${propType.type}' is not supported.`);
  }
  return (
    `${propType.isRequired ? '[Required]\n' : ''}` +
    `public ${generator(propType)} ${capitalize(name)} { get; set; }`
  );
};

const classGenerators = {
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
      .map(([name, type]) => generateProperty(name, type))
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

function generateClass(name, propType, baseClass) {
  const generator = classGenerators[propType.type];
  if (typeof generator !== 'function') {
    throw new Error(`Type '${propType.type}' is not supported.`);
  }
  return generator(name, propType, baseClass);
}

const generateClassExtends = (className, otherClassName) =>
  `public class ${className} : ${otherClassName}\n{\n}`;

module.exports = { generateClass, generateClassExtends };
