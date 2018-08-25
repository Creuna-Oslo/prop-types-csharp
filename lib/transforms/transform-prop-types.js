const traverse = require('@babel/traverse').default;
const t = require('babel-types');

const typesToStrip = ['element', 'func', 'instanceOf', 'node'];

const illegalTypes = {
  array: `Replace with 'PropTypes.arrayOf' or provide a meta type`,
  object: `Replace with 'PropTypes.shape' or provide a meta type`,
  oneOfType: `'PropTypes.oneOfType' is not yet supported`
};

// This function mutates the provided syntaxTree, doing the following (in this order):
//  - Excludes props that match typesToStrip or have an 'exclude' meta type
//  - Replaces PropType definitions with meta types if provided
//  - Validates type against illegalTypes
//  - Replaces 'PropTypes.x' with 'x'
//  - Validates References to other components in 'arrayOf'

// This is a lot of different things in a single function, but it is necessary in order to avoid excessive traversal of the syntax tree.

const isPropRequired = (objectPropertyPath, callback) => {
  let isRequired = false;

  objectPropertyPath.traverse({
    MemberExpression(path) {
      const parent = path.findParent(parent => t.isObjectProperty(parent));

      if (
        path.get('property').isIdentifier({ name: 'isRequired' }) &&
        parent === objectPropertyPath
      ) {
        isRequired = true;
        path.stop();
      }
    }
  });

  callback(isRequired);
};

module.exports = function({
  propTypesIdentifierName,
  propTypesMeta,
  syntaxTree
}) {
  const shouldExclude = (propName, typeName) => {
    return (
      typesToStrip.includes(typeName) ||
      t.isIdentifier(propTypesMeta[propName], { name: 'exclude' })
    );
  };

  traverse(syntaxTree, {
    MemberExpression(path) {
      if (path.get('object').isIdentifier({ name: propTypesIdentifierName })) {
        const parent = path.findParent(parent => parent.isObjectProperty());
        const propName = parent && parent.node.key.name;
        const typeName = path.node.property.name;
        const meta = propTypesMeta[propName];

        // Strip if type matches typesToStrip or has 'exclude' meta type
        if (shouldExclude(propName, typeName)) {
          return parent.remove();
        }

        // Replace type with meta type if a meta type exists
        if (meta) {
          isPropRequired(parent, isRequired => {
            parent
              .get('value')
              .replaceWith(
                isRequired
                  ? t.memberExpression(meta, t.identifier('isRequired'))
                  : meta
              );
          });

          return;
        }

        // Replace `PropTypes.number` with 'int' if meta type is missing
        if (typeName === 'number') {
          path.replaceWith(t.identifier('int'));
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

  traverse(syntaxTree, {
    CallExpression(path) {
      const parent = path.findParent(parent => parent.isObjectProperty());
      const propName = parent && parent.node.key.name;
      const callee = path.get('callee');
      const argument = path.node.arguments[0];

      // Strip if type has 'exclude' meta type
      if (shouldExclude(propName)) {
        return parent.remove();
      }

      // Throw when there's a reference to 'Component.propTypes' inside an 'arrayOf' without use of 'shape'
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
