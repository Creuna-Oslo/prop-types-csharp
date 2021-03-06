const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const extractMeta = require('./extract-meta');

module.exports = function({ syntaxTree }) {
  let propTypesMeta = {};

  traverse(syntaxTree, {
    // Functional component
    AssignmentExpression(path) {
      const left = path.get('left');

      if (
        t.isMemberExpression(left) &&
        left.get('property').isIdentifier({ name: 'propTypesMeta' })
      ) {
        propTypesMeta = extractMeta(path.node.right);
        path.stop();
      }
    },

    // Class component
    ClassProperty(path) {
      if (path.get('key').isIdentifier({ name: 'propTypesMeta' })) {
        propTypesMeta = extractMeta(path.node.value);
        path.stop();
      }

      path.skip();
    }
  });

  return { propTypesMeta };
};
