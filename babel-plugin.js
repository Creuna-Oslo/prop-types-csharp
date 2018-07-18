module.exports = function({ types: t }) {
  return {
    visitor: {
      AssignmentExpression(path) {
        const left = path.get('left');
        if (
          t.isMemberExpression(left) &&
          left.get('property').isIdentifier({ name: 'propTypesMeta' })
        ) {
          path.remove();
          path.stop();
        }

        // Skip traversing of nested assignments, like in a functional component
        path.skip();
      },
      ClassProperty(path) {
        const key = path.get('key');
        if (key.isIdentifier({ name: 'propTypesMeta' })) {
          path.remove();
          path.stop();
        }

        // Skip traversing children of class properties
        path.skip();
      }
    }
  };
};
