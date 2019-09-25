const { match, get } = require('kompis');
const getFunctionName = require('../common/get-function-name');
const t = require('@babel/types');

const parseKey = match(
  [t.isStringLiteral, get('value')],
  [t.isIdentifier, get('name')]
);

const validateKey = node => {
  if (node.computed) {
    throw new Error(`Computed object keys are not supported.`);
  }
  return node;
};

module.exports = callExpression => {
  const { callee } = callExpression;
  const [argument] = callExpression.arguments;

  if (!argument) return null;

  const { properties } = argument;

  switch (callee.property.name) {
    case 'keys':
      return properties.map(validateKey).map(p => parseKey(p.key)); // Expecting Identifier node
    case 'values':
      // Object.values is represented using objects, to be able to use the object keys for property names in the generated enums
      return properties.map(validateKey).map(p => ({
        key: parseKey(p.key),
        value: p.value.value
      })); // Expecting Literal node for p.value
    default:
      throw new Error(
        `Unsupported method '${getFunctionName(callExpression)}'.`
      );
  }
};
