const traverse = require('@babel/traverse').default;
const t = require('babel-types');

module.exports = function(syntaxTree, pascalComponentName) {
  let propTypes,
    propTypesMeta = {};

  traverse(syntaxTree, {
    AssignmentExpression(path) {
      const left = path.get('left');

      if (
        !t.isMemberExpression(left) ||
        !left.get('object').isIdentifier({ name: pascalComponentName })
      ) {
        return;
      }

      // Get propTypes for functional component
      if (left.get('property').isIdentifier({ name: 'propTypes' })) {
        propTypes = t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.identifier(pascalComponentName),
            path.node.right
          )
        );
        path.skip();
      }

      if (left.get('property').isIdentifier({ name: 'propTypesMeta' })) {
        propTypesMeta = path.node.right.properties.reduce(
          (accum, property) =>
            Object.assign({}, accum, {
              [property.key.name]: property.value.value
            }),
          {}
        );
      }
    }
  });

  if (propTypes) {
    return { propTypes, propTypesMeta };
  }

  traverse(syntaxTree, {
    ClassProperty(path) {
      const key = path.get('key');

      if (key.isIdentifier({ name: 'propTypes' })) {
        propTypes = t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.identifier(pascalComponentName),
            path.node.value
          )
        );
      }

      if (key.isIdentifier({ name: 'propTypesMeta' })) {
        propTypesMeta = path.node.value.properties.reduce(
          (accum, property) =>
            Object.assign({}, accum, {
              [property.key.name]: property.value.value
            }),
          {}
        );
      }

      path.skip();
    }
  });

  if (propTypes) {
    return { propTypes, propTypesMeta };
  }

  throw new Error('PropTypes not found');
};
