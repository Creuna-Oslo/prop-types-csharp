const typesToStrip = ['element', 'func', 'instanceOf', 'node'];

const illegalTypes = {
  array: `Replace with 'PropTypes.arrayOf' or provide a meta type`,
  object: `Replace with 'PropTypes.shape' or provide a meta type`,
  oneOfType: `'PropTypes.oneOfType' is not yet supported`
};

// This function mutates the provided propTypes tree, doing the following:
//  - Excludes props that match typesToStrip or have an 'exclude' meta type
//  - Replaces PropType definitions with meta types if provided
//  - Validates type against illegalTypes

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
