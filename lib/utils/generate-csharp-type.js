const t = require('babel-types');

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

  let typeNode;

  switch (node.type) {
    case 'MemberExpression':
      typeNode = node.object;
      break;
    case 'ArrayExpression':
      typeNode = node.elements[0];
      break;
    case 'ObjectExpression':
      typeNode = node.properties[0].value;
      break;
    case 'Identifier':
      typeNode = node;
      break;
    case 'CallExpression':
      throw new Error(
        `Invalid function call '${node.callee.name}' in '${propName}'`
      );
  }

  // the type might be another call expression. If so, RECURSE
  const typeName = t.isIdentifier(typeNode)
    ? typeNode.name
    : generateCSharpType(typeNode, propName);

  if (!typeName) {
    throw badTypeError(propName);
  }

  return isArray ? `IList<${typeName}>` : typeName;
}

module.exports = generateCSharpType;
