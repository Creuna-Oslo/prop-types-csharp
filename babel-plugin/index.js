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
        }

        // Can't do path.skip() for this one for some strange reason. See https://github.com/Creuna-Oslo/prop-types-csharp-webpack-plugin/issues/21
      },
      ClassDeclaration(path) {
        // For some reason, with Babel >= 7, the 'ClassProperty' visitor isn't executed as it was in previous versions of Babel. This slightly less clean approach is needed for the plugin to work in v7 and greater.
        if (path.node.body && path.node.body.body) {
          const body = path.get('body');
          const newBody = path.node.body.body.filter(
            property => !t.isIdentifier(property.key, { name: 'propTypesMeta' })
          );
          body.replaceWith(t.classBody(newBody));
        }
      },
      ClassProperty(path) {
        const key = path.get('key');
        if (key.isIdentifier({ name: 'propTypesMeta' })) {
          path.remove();
        }
      }
    }
  };
};
