const traverse = require('@babel/traverse').default;

// This function mutates the provided syntaxTree, replacing 'PropTypes.x' with 'x'

module.exports = function({
  propTypesIdentifierName = 'PropTypes',
  syntaxTree
}) {
  traverse(syntaxTree, {
    MemberExpression(path) {
      const { node } = path;

      if (node.object.name === propTypesIdentifierName) {
        path.replaceWith(node.property);
      }
    }
  });
};
