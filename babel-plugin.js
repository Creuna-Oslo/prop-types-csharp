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

        // Can't do path.skip() for this one for some strange reason. See https://github.com/Creuna-Oslo/prop-types-csharp-webpack-plugin/issues/21
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
