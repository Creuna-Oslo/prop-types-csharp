const t = require('babel-types');

const allowedStringTypes = ['exclude', 'float', 'int'];

module.exports = function(metaProperties) {
  return metaProperties.reduce((accum, property) => {
    const propertyName = property.key.name;
    let propertyValue;

    // 'exclude', 'float' and 'int'
    if (t.isStringLiteral(property.value)) {
      const type = property.value.value;

      if (!allowedStringTypes.includes(type)) {
        throw new Error(
          `Invalid meta type '${type}' for '${propertyName}'. Expected one of [${allowedStringTypes}]`
        );
      }

      propertyValue = t.identifier(type);
    }

    // Component -> "Component" (Return React component name as string)
    if (t.isIdentifier(property.value)) {
      propertyValue = property.value;
    }

    // Array(Component) -> "arrayOf(Component)" (Return PropTypes-like string);
    if (t.isCallExpression(property.value)) {
      const typeName = property.value.arguments[0].name;
      propertyValue = t.callExpression(
        t.identifier('arrayOf'),
        property.value.arguments
      );
    }

    return Object.assign({}, accum, {
      [propertyName]: propertyValue
    });
  }, {});
};
