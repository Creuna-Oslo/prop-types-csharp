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
    const value = objectProperty.value;

    // Function calls not coming from PropTypes are illegal. Detect this by checking if the callee is an identifier (PropTypes.something is a MemberExpression).
    if (t.isCallExpression(value) && t.isIdentifier(value.callee)) {
      return Object.assign(accum, {
        [key]: { node: value, message: messages.illegalFunctionCall }
      });
    }

    // propTypeNode might be a CallExpression node (like in 'PropTypes.arrayOf()'), in which case the propType node will be accessible in obectProperty.value.callee. If not, the node is a MemberExpression, and the node is accessible in objectProperty.value.
    const propTypeNode = objectProperty.value.callee || objectProperty.value;

    if (t.isMemberExpression(propTypeNode)) {
      const isRequired =
        t.isMemberExpression(propTypeNode.object) &&
        t.isIdentifier(propTypeNode.property, { name: 'isRequired' });

      // If .isRequired is used, 'propTypeNode.object' will be another MemberExpression. The type name will be accessible in the 'property' property of 'propTypeNode.object'.
      const propTypeName = isRequired
        ? propTypeNode.object.property.name
        : propTypeNode.property.name;

      if (illegalTypes[propTypeName]) {
        accum[key] = {
          node: propTypeNode.property,
          message: illegalTypes[propTypeName]
        };
      }
    }

    return accum;
  }, {});
};
