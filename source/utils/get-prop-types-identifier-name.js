const traverse = require('@babel/traverse').default;

// Returns:
//  - propTypesIdentifierName: String.

module.exports = function({ syntaxTree }) {
  let propTypesIdentifierName;

  traverse(syntaxTree, {
    // Get PropTypes variable name from import statement.
    ImportDeclaration(path) {
      if (path.get('source').isStringLiteral({ value: 'prop-types' })) {
        propTypesIdentifierName = path.node.specifiers[0].local.name;
        path.stop();
      }
    }
  });

  return { propTypesIdentifierName };
};
