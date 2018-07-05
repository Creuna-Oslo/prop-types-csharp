const traverse = require('@babel/traverse').default;
const t = require('babel-types');

const typesToStrip = ['element', 'func', 'instanceOf', 'node'];

const illegalTypes = {
  number: `Add meta type 'int' or 'float'`,
  object: `Replace with 'PropTypes.shape' or provide a meta type`,
  array: `Replace with 'PropTypes.arrayOf' or provide a meta type`
};

// This function mutates the provided syntaxTree, doing the following (in this order):
//  - Excludes props that have an 'exclude' meta type
//  - Strip props that match typesToStrip
//  - Replaces PropType definitions with meta types if provided
//  - Validates type against illegalTypes
//  - Replaces 'PropTypes.x' with 'x'
//  - Validates References to other components in 'arrayOf'

// This is a lot of different things in a single function, but it is necessary in order to avoid excessive traversal of the syntax tree.

module.exports = function({
  propTypesIdentifierName,
  propTypesMeta,
  syntaxTree
}) {
  // Strip props excluded in propTypesMeta
  traverse(syntaxTree, {
    ObjectProperty(path) {
      const propName = path.node.key.name;

      if (t.isIdentifier(propTypesMeta[propName], { name: 'exclude' })) {
        path.remove();
        path.skip();
      }
    }
  });

  traverse(syntaxTree, {
    MemberExpression(path) {
      // Replace 'PropTypes.x' with 'x' and strip types that only makes sense on the client
      if (path.get('object').isIdentifier({ name: propTypesIdentifierName })) {
        const parent = path.findParent(parent => parent.isObjectProperty());
        const propName = parent && parent.node.key.name;
        const typeName = path.node.property.name;
        const meta = propTypesMeta[propName];

        // Strip if type matches typesToStrip
        if (typesToStrip.includes(typeName)) {
          return parent.remove();
        }

        // Replace type with meta type if a meta type exists
        if (meta) {
          path.replaceWith(propTypesMeta[propName]);
          return;
        }

        if (illegalTypes[typeName]) {
          throw new Error(
            `Invalid type '${typeName}' for prop '${propName}'.\n${
              illegalTypes[typeName]
            }`
          );
        }

        // Replace PropTypes.x with x
        path.replaceWith(path.node.property);
      }
    }
  });

  // Throw when there's a reference to 'Component.propTypes' inside an 'arrayOf'
  traverse(syntaxTree, {
    CallExpression(path) {
      const parent = path.findParent(parent => parent.isObjectProperty());
      const propName = parent && parent.node.key.name;
      const callee = path.get('callee');
      const argument = path.node.arguments[0];

      if (
        t.isMemberExpression(argument) &&
        argument.property.name === 'propTypes' &&
        callee.isIdentifier({ name: 'arrayOf' })
      ) {
        throw new Error(
          `Illegal value provided to 'PropTypes.arrayOf' on prop '${propName}'. References to Other components' propTypes must be wrapped in 'PropTypes.shape'`
        );
      }
    }
  });
};
