const traverse = require('@babel/traverse').default;
const t = require('babel-types');

const extractMeta = require('./extract-meta');

// Returns:
//  - propTypesMeta: JS Object with Babel nodes as values. Node type is either Identifier or CallExpression

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
        propTypesMeta = extractMeta(path.node.right.properties);
        path.stop();
      }
    },

    // Class component
    ClassProperty(path) {
      if (path.get('key').isIdentifier({ name: 'propTypesMeta' })) {
        propTypesMeta = extractMeta(path.node.value.properties);
        path.stop();
      }

      path.skip();
    }
  });

  return { propTypesMeta };
};
