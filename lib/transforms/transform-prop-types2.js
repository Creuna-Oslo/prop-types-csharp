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

// Expand references from 'shape'
// shape(Component) -> Component
const expandShapeReference = propType => {
  if (propType.type === 'shape' && propType.argument) {
    return expandShapeReference(propType.argument);
  }

  return propType;
};

const transformPropTypes = (propTypes, propTypesMeta) => {
  // 'propTypes' is a string when 'A.propTypes = B.propTypes;'
  if (typeof propTypes === 'string') {
    return propTypes;
  }

  return Object.entries(propTypes).reduce((accum, [propName, propType]) => {
    const { argument, type } = propType;
    const meta = propTypesMeta[propName];

    if (typesToStrip.includes(type) || (meta && meta.type === 'exclude')) {
      return accum;
    }

    if (type === 'shape' && meta) {
      argument;
      return {
        ...accum,
        [propName]: {
          ...propType,
          argument: transformPropTypes(propType.argument, meta.argument)
        }
      };
    }

    if (meta) {
      return { ...accum, [propName]: { ...propType, ...meta } };
    }

    if (type === 'number') {
      return { ...accum, [propName]: { ...propType, type: 'int' } };
    }

    if (illegalTypes[type]) {
      throw new Error(
        `Invalid type '${type}' for prop '${propName}'.\n${illegalTypes[type]}`
      );
    }

    return { ...accum, [propName]: propType };
  }, {});
};

module.exports = transformPropTypes;
