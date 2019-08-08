const capitalize = require('../capitalize');

const enumProperties = require('./enum-properties');
const parentPrefixedName = require('../parent-prefixed-name');
const primitiveTypes = require('../../primitive-types');

const typeNames = Object.assign(
  // NOTE: This is where stuff like 'bool', 'string' etc goes
  primitiveTypes.reduce(
    (accum, typeName) =>
      Object.assign(accum, { [typeName]: () => capitalize(typeName) }),
    {}
  ),
  {
    ref: propType =>
      propType.parents
        ? parentPrefixedName(propType.ref, propType.parents)
        : propType.ref,
    arrayOf: propType => {
      const childGenerator = typeNames[propType.children.type];
      return `Array<${childGenerator(propType.children)}>`;
    },
    objectOf: propType => {
      const childGenerator = typeNames[propType.children.type];
      return `Map<String, ${childGenerator(propType.children)}>`;
    }
  }
);

const generateProperty = (name, propType) => {
  const generator = typeNames[propType.type];
  if (typeof generator !== 'function') {
    throw new Error(`Type '${propType.type}' is not supported.`);
  }
  return `val ${name}: ${generator(propType)}${
    !propType.isRequired ? '? = null' : ''
  }`;
};

const classGenerators = {
  oneOf: (name, propType) => {
    const body = enumProperties(name, propType);
    const enumName = parentPrefixedName(name, propType.parents);
    const override =
      '\noverride fun toString(): String {\nreturn stringValue;\n}';
    return `enum class ${enumName}(val stringValue: String) {\n${body}${override}\n}`;
  },

  shape: (propName, propType, baseClass) => {
    const { children } = propType;
    const properties = Object.entries(children)
      .map(([name, type]) => generateProperty(name, type))
      .join(',\n');
    const body = properties.length ? `${properties}\n` : '';
    const className = propType.parents
      ? parentPrefixedName(propName, propType.parents)
      : capitalize(propName);

    // NOTE: If the class doesn't have parents, it is the main component class, and should extend the baseClass if any.
    const isComponentClass = !propType.parents;
    const classExtends =
      isComponentClass && baseClass && baseClass !== className
        ? ` : ${baseClass}()`
        : '';
    return `${
      isComponentClass ? 'open ' : ''
    }class ${className}(\n${body})${classExtends}`;
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
  `typealias ${className} = ${otherClassName}`;

module.exports = { generateClass, generateClassExtends };
