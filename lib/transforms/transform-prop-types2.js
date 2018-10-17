const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const getMetaNodeForProp = require('../utils/get-meta-node-for-prop');

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

const maybeRequiredNode = (node, isRequired) => {
  return isRequired
    ? t.memberExpression(node, t.identifier('isRequired'))
    : node;
};

// Expand references from 'shape'
// shape(Component) -> Component
/*
{ type: 'shape', argument: { type: 'Link' } }
{ type: 'shape', argument: { propertyA: { type: 'string' } } }
*/
const expandShapeReference = propType => {
  if (propType.type !== 'shape' || propType.argument) {
    return propType;
  }

  if (propType.argument) {
    return expandShapeReference(propType.argument);
  }

  return propType;
};

const transformPropTypes = ({ propTypes, propTypesMeta }) => {
  return Object.entries(propTypes).reduce((accum, [propName, propType]) => {
    const { type } = propType;
    const meta = propTypesMeta[propName];

    if (typesToStrip.includes(type) || (meta && meta.type === 'exclude')) {
      return accum;
    }

    if (meta) {
      return { ...accum, [propName]: { ...propType, ...meta } };
    }

    if (type === 'number') {
      return { ...accum, [propName]: { ...propType, type: 'int' } };
    }

    // PropTypes.shape(SomeComponent.propTypes):
    // Only 'shape', 'oneOf' and 'arrayOf' will have an 'argument' property, meaning that if propType.argument.argument doesn't exist, propType.argument is a primitive type.
    if (type === 'shape' && typeof propType.argument.type === 'string') {
      return {
        ...accum,
        [propName]: { ...propType, ...propType.argument, argument: null }
      };
    }

    if (illegalTypes[type]) {
      throw new Error(
        `Invalid type '${type}' for prop '${propName}'.\n${illegalTypes[type]}`
      );
    }

    return { ...accum, [propName]: propType };
  }, {});

  traverse(syntaxTree, {
    ObjectProperty(path) {
      const valuePath = path.get('value');
      const value = path.node.value;
      const propName = path.node.key.name;
      const isFunction = t.isCallExpression(value);
      const typeNode = isFunction ? value.callee : value;
      const isMember = t.isMemberExpression(typeNode);
      const typeName = isMember ? typeNode.object.name : typeNode.name;
      const meta = getMetaNodeForProp({ path, propTypesMeta });
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
        valuePath.replaceWith(maybeRequiredNode(meta, isRequired));

        return;
      }

      // Replace `PropTypes.number` with 'int' if meta type is missing
      if (typeName === 'number') {
        valuePath.replaceWith(
          maybeRequiredNode(t.identifier('int'), isRequired)
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

module.exports = transformPropTypes;
