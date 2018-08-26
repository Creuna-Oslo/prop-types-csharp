const t = require('babel-types');

const getNodeOfType = require('./get-node-of-type');

const badTypeError = propName => {
  return new Error(
    `Found bad type for ${propName}. Please check for incompatibilities with this plugin:\n
• Wrap references other Components' propTypes with 'PropTypes.shape'
• Don't reference imported objects/arrays in 'PropTypes.oneOf'`
  );
};

// Excpects an Identifier, an ArrayExpression or a MemberExpression node
function generateCSharpType(node, propName) {
  const isArray = t.isArrayExpression(node);

  const typeNode = getNodeOfType(
    node,
    {
      MemberExpression: node => node.object,
      ArrayExpression: node => node.elements[0],
      ObjectExpression: node => node.properties[0].value,
      Identifier: node => node,
      CallExpression: node => {
        throw new Error(
          `Invalid function call '${node.callee.name}' in '${propName}'`
        );
      }
    },
    () => {
      throw badTypeError(propName);
    }
  );

  // the type might be another call expression. If so, RECURSE
  const typeName = t.isIdentifier(typeNode)
    ? typeNode.name
    : generateCSharpType(typeNode, propName);

  return isArray ? `IList<${typeName}>` : typeName;
}

module.exports = generateCSharpType;
