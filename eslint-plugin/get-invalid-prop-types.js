const t = require('babel-types');

const messages = require('./messages');

const illegalTypes = {
  array: messages.array,
  object: messages.object,
  oneOfType: messages.oneOfType
};

module.exports = objectExpression => {
  return objectExpression.properties.reduce((accum, objectProperty) => {
    const key = objectProperty.key.name;

    // propTypeNode might be a CallExpression node (like in 'arrayOf()'), in which case the propType node will be accessible in obectProperty.value.callee. If not, the node is a MemberExpression, and the node is accessible in objectProperty.value.
    const propTypeNode = objectProperty.value.callee || objectProperty.value;
    const propTypeName = propTypeNode.property.name;

    if (t.isMemberExpression(propTypeNode) && illegalTypes[propTypeName]) {
      accum[key] = {
        node: propTypeNode.property,
        message: illegalTypes[propTypeName]
      };
    }

    return accum;
  }, {});
};
