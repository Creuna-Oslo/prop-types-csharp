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

const buildRequiredNode = (node, isRequired) => {
  return isRequired
    ? t.memberExpression(node, t.identifier('isRequired'))
    : node;
};

module.exports = function({ propTypesMeta, syntaxTree }) {
  const getMetaNode = (path, propNames = []) => {
    if (!propTypesMeta) {
      return;
    }

    const objectPropertyParent = path.findParent(parent =>
      t.isObjectProperty(parent)
    );

    if (objectPropertyParent) {
      return getMetaNode(
        objectPropertyParent,
        propNames.concat(objectPropertyParent.node.key.name)
      );
    }

    return propNames
      .reverse()
      .reduce((accum, propName) => accum && accum[propName], propTypesMeta);
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
      const isFunction = t.isCallExpression(value);
      const typeNode = isFunction ? value.callee : value;
      const isMember = t.isMemberExpression(typeNode);
      const typeName = isMember ? typeNode.object.name : typeNode.name;
      const meta = getMetaNode(path, [propName]);
      const isRequired =
        isMember && t.isIdentifier(typeNode.property, { name: 'isRequired' });

      // Strip if type matches typesToStrip or has 'exclude' meta type
      if (
        typesToStrip.includes(typeName) ||
        t.isIdentifier(meta, { name: 'exclude' })
      ) {
        return path.remove();
      }

      // Replace type with meta type if a meta type exists
      if (meta && (t.isIdentifier(meta) || t.isArrayExpression(meta))) {
        valuePath.replaceWith(buildRequiredNode(meta, isRequired));

        return;
      }

      // Replace `PropTypes.number` with 'int' if meta type is missing
      if (typeName === 'number') {
        valuePath.replaceWith(
          buildRequiredNode(t.identifier('int'), isRequired)
        );
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
      const calleeName = callee.isMemberExpression()
        ? callee.node.object.name
        : callee.node.name;
      const argument = path.node.arguments[0];

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
