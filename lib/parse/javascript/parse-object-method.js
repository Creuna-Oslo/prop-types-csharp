const getFunctionName = require('../common/get-function-name');

module.exports = callExpression => {
  const { callee } = callExpression;
  const [argument] = callExpression.arguments;

  if (!argument) return null;

  const { properties } = argument;

  switch (callee.property.name) {
    case 'keys':
      return properties.map(p => p.key.name); // Expecting Identifier node
    case 'values':
      // Object.values is represented using objects, to be able to use the object keys for property names in the generated enums
      return properties.map(p => ({ key: p.key.name, value: p.value.value })); // Expecting Literal node for p.value
    default:
      throw new Error(
        `Unsupported method '${getFunctionName(callExpression)}'.`
      );
  }
};
