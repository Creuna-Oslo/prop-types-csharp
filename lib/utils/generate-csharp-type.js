const t = require('babel-types');

const badTypeError = propName => {
  return new Error(
    `Found bad type for ${propName}. Please check for incompatibilities with this plugin:\n
• Wrap references other Components' propTypes with 'PropTypes.shape'
• Don't reference imported objects/arrays in 'PropTypes.oneOf'`
  );
};

// Excpects an Identifier node or a MemberExpression node
function generateCSharpType(node, propName) {
  const isObject = t.isMemberExpression(node);

  // If node is a member expression node, the node we're interested in will be nested under 'node.object'. This typically happens with arrayOf(something).isRequired, with 'arrayOf' being the 'object' and 'isRequired' being the 'property'
  const maybeArrayOfNode = isObject ? node.object : node;

  let isArrayOf = false;

  if (t.isCallExpression(maybeArrayOfNode)) {
    if (maybeArrayOfNode.callee.name === 'arrayOf') {
      isArrayOf = true;
    } else {
      throw new Error(
        `Invalid function call '${
          maybeArrayOfNode.callee.name
        }' in '${propName}'`
      );
    }
  }

  // The node might be a call to 'arrayOf'. In that case we need to extract the node containing the type definition from maybeArrayNode.arguments
  const typeNode = isArrayOf ? maybeArrayOfNode.arguments[0] : maybeArrayOfNode;

  // the type might be another call expression. If so, RECURSE
  const typeName = t.isCallExpression(typeNode)
    ? generateCSharpType(typeNode, propName)
    : typeNode.name;

  if (!typeName) {
    throw badTypeError(propName);
  }

  return isArrayOf ? `IList<${typeName}>` : typeName;
}

module.exports = generateCSharpType;
