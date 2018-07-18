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

        // In some cases there might be deeply nested assignments, like in a complex functional component. This plugin is only interested in the outermost scope, so traversal of nested assignments are skipped
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
