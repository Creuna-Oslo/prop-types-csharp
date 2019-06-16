const capitalize = require('../capitalize');

const enumProperties = require('./enum-properties');
const mapBasicType = require('./map-basic-type');
const nestedArrayString = require('./nested-array-string');
const parentPrefixedName = require('../parent-prefixed-name');

const property = (name, { isRequired }, type) =>
  `val ${name}: ${type}${!isRequired ? '? = null' : ''}`;

const simpleProperty = type => (name, propType) =>
  property(name, propType, type);

const generators = {
  // This handles anything that's not a propType, like { type: 'OtherComponentName' } or a reference to a class defined in the currently generated file
  other: (name, propType, _baseClass) => {
    const typeName = propType.parents
      ? parentPrefixedName(propType.type, propType.parents)
      : propType.type;
    return property(name, propType, typeName);
  },

  bool: simpleProperty('Boolean'),
  float: simpleProperty('Float'),
  int: simpleProperty('Int'),
  string: simpleProperty('String'),

  arrayOf: (name, propType, _baseClass) =>
    property(name, propType, nestedArrayString(propType, 'Array')),

  oneOf: (name, propType) => {
    const body = enumProperties(name, propType);
    const enumName = parentPrefixedName(name, propType.parents);
    const override =
      '\noverride fun toString(): String {\nreturn stringValue;\n}';
    return `enum class ${enumName}(val stringValue: String) {\n${body}${override}\n}`;
  },

  objectOf: (name, propType, _baseClass) => {
    const valueType = mapBasicType(
      propType.children.parents
        ? parentPrefixedName(propType.children.type, propType.children.parents)
        : propType.children.type
    );
    return property(name, propType, `Map<String, ${valueType}>`);
  },

  shape: (propName, propType, baseClass) => {
    const { children } = propType;
    const properties = Object.entries(children)
      .map(([name, type]) => generateClass(name, type, ''))
      .join(',\n');
    const body = properties.length ? `${properties}\n` : '';
    const className = propType.parents
      ? parentPrefixedName(propName, propType.parents)
      : capitalize(propName);

    // NOTE: If the class doesn't have parents, it is the main component class, and should extend the baseClass if any.
    const isComponentClass = !propType.parents;
    const classExtends =
      isComponentClass && baseClass && baseClass !== className
        ? ` : ${baseClass}`
        : '';
    return `data class ${className}${classExtends}(\n${body})`;
  }
};

const getGenerator = typeName => generators[typeName] || generators.other;

function generateClass(name, propType, baseClass) {
  const generator = getGenerator(propType.type);
  return generator(
    name,
    { ...propType, parents: propType.parents || [] },
    baseClass
  );
}

const generateClassExtends = (className, otherClassName) =>
  `typealias ${className} = ${otherClassName}`;

module.exports = { generateClass, generateClassExtends };
