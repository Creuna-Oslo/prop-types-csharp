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

    if (t.isIdentifier(property.value)) {
      // Create new Identifier from existing Identifier for easier testing
      propertyValue = t.identifier(property.value.name);
    }

    if (t.isObjectExpression(property.value)) {
      propertyValue = property.value;
    }

    // Convert to PropTypes-like definition.
    // Array(Component) -> arrayOf(Component)
    if (t.isCallExpression(property.value)) {
      if (property.value.callee.name !== 'Array') {
        throw new Error(
          `Unsupported function call in meta type for '${propertyName}'`
        );
      }

      propertyValue = t.callExpression(
        t.identifier('arrayOf'),
        property.value.arguments
      );
    }

    if (!propertyValue) {
      throw new Error(`Unsupported meta type for '${propertyName}'`);
    }

    return Object.assign({}, accum, {
      [propertyName]: propertyValue
    });
  }, {});
};
