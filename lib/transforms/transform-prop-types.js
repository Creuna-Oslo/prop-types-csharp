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
//  - Validates References to other components in 'arrayOf'

// This is a lot of different things in a single function, but it is necessary in order to avoid excessive traversal of the syntax tree.

const isPropRequired = objectPropertyPath => {
  let isRequired = false;

  objectPropertyPath.traverse({
    MemberExpression(path) {
      if (path.get('property').isIdentifier({ name: 'isRequired' })) {
        isRequired = true;
        path.stop();
      }
    }
  });

  return isRequired;
};

module.exports = function({ propTypesMeta, syntaxTree }) {
  const shouldExclude = (propName, typeName) => {
    return (
      typesToStrip.includes(typeName) ||
      t.isIdentifier(propTypesMeta[propName], { name: 'exclude' })
    );
  };

  traverse(syntaxTree, {
    MemberExpression(path) {
      // Replace 'Component.propTypes' with 'Component'
      if (path.get('property').isIdentifier({ name: 'propTypes' })) {
        path.replaceWith(path.node.object);
      }
    },
    ObjectProperty(path) {
      const valuePath = path.get('value');
      const value = path.node.value;
      const propName = path.node.key.name;

      // When removing 'path' (when prop is excluded), things get weird when prop has nested member expressions. The visitor function will run for nested member expression even though the path was removed, and it seems like in those cases, 'path' is now a reference to the 'file' node of the AST. Removing the 'file' node throws an error. Checking for the existence of 'path.node' seems to fix the issue.
      if (!path.node) {
        return;
      }

      const typeName = value.name;
      const meta = propTypesMeta[propName];

      // Strip if type matches typesToStrip or has 'exclude' meta type
      if (shouldExclude(propName, typeName)) {
        path.remove();
        path.skip();
        return;
      }

      // Replace type with meta type if a meta type exists
      if (meta) {
        const isRequired = isPropRequired(path);
        valuePath.replaceWith(
          isRequired
            ? t.memberExpression(meta, t.identifier('isRequired'))
            : meta
        );

        path.skip();
        return;
      }

      // Replace `PropTypes.number` with 'int' if meta type is missing
      if (typeName === 'number') {
        valuePath.replaceWith(t.identifier('int'));
        return;
      }

      if (illegalTypes[typeName]) {
        throw new Error(
          `Invalid type '${typeName}' for prop '${propName}'.\n${
            illegalTypes[typeName]
          }`
        );
      }
    },
    CallExpression(path) {
      const parent = path.findParent(parent => parent.isObjectProperty());
      const propName = parent && parent.node.key.name;
      const callee = path.get('callee');
      const calleeIsMember = callee.isMemberExpression();
      const calleeName = calleeIsMember
        ? callee.node.object.name
        : callee.node.name;
      const argument = path.node.arguments[0];

      // Strip if type has 'exclude' meta type
      if (shouldExclude(propName, calleeName)) {
        return parent.remove();
      }

      switch (calleeName) {
        case 'shape':
          path.replaceWith(argument);
          break;
        case 'arrayOf':
          path.replaceWith(t.arrayExpression([argument]));
          break;
        default:
          throw new Error(
            `Invalid function call '${calleeName}' in '${propName}'`
          );
      }
    }
  });
};
