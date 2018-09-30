const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

// Returns Babel node containing only propTypes

module.exports = function({ componentName, syntaxTree }) {
  let propTypesAST;

  traverse(syntaxTree, {
    AssignmentExpression(path) {
      const left = path.get('left');

      if (
        !t.isMemberExpression(left) ||
        !left.get('object').isIdentifier({ name: componentName })
      ) {
        return;
      }

      // Get propTypes for functional component
      if (left.get('property').isIdentifier({ name: 'propTypes' })) {
        propTypesAST = t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.identifier(componentName),
            path.node.right
          )
        );
        path.skip();
      }
    }
  });

  if (propTypesAST) {
    return { propTypesAST };
  }

  traverse(syntaxTree, {
    ClassProperty(path) {
      const key = path.get('key');

      if (key.isIdentifier({ name: 'propTypes' })) {
        propTypesAST = t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.identifier(componentName),
            path.node.value
          )
        );
      }

      path.skip();
    }
  });

  if (propTypesAST) {
    return { propTypesAST };
  }

  throw new Error('PropTypes not found');
};
