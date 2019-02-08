const { not } = require('kompis');

module.exports = function({ types: t }) {
  const isPropTypesMeta = key => node =>
    t.isIdentifier(node[key], { name: 'propTypesMeta' });

  return {
    visitor: {
      AssignmentExpression(path) {
        const value = path.node.left;
        if (t.isMemberExpression(value) && isPropTypesMeta('property')(value)) {
          path.remove();
        }

        // Can't do path.skip() for this one for some strange reason. See https://github.com/Creuna-Oslo/prop-types-csharp-webpack-plugin/issues/21
      },
      ClassDeclaration(path) {
        // For some reason, with Babel >= 7, the 'ClassProperty' visitor isn't executed as it was in previous versions of Babel. This slightly less clean approach is needed for the plugin to work in v7 and greater.
        const newBody = path.node.body.body.filter(not(isPropTypesMeta('key')));
        path.get('body').replaceWith(t.classBody(newBody));
      }
    }
  };
};
