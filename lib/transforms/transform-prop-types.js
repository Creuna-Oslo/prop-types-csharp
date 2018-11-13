const typesToStrip = ['element', 'func', 'instanceOf', 'node'];

const illegalTypes = {
  array: `Replace with 'PropTypes.arrayOf' or provide a meta type`,
  object: `Replace with 'PropTypes.shape' or provide a meta type`,
  oneOfType: `'PropTypes.oneOfType' is not yet supported`
};

// Returns a new propTypes object with the following changes:
//  - Excludes props that match typesToStrip or have an 'exclude' meta type
//  - Replaces PropType definitions with meta types if provided
//  - Validates type against illegalTypes

// See test for examples (/test/lib/transform-prop-types.js)

const transformSingleProp = (propName, propType, meta = {}) => {
  const { type } = propType;

  if (typesToStrip.includes(type) || meta.type === 'exclude') {
    return;
  }

  if (propType.argument) {
    if (typesToStrip.includes(propType.argument.type)) {
      return;
    }

    if (propType.argument.type === 'shape') {
      return {
        ...propType,
        argument: transformSingleProp(
          propName,
          propType.argument,
          meta.argument
        )
      };
    }
  }

  if (type === 'shape') {
    return {
      ...propType,
      argument: transformPropTypes(propType.argument, meta.argument)
    };
  }

  if (Object.keys(meta).length) {
    return { ...propType, ...meta };
  }

  if (type === 'number') {
    return { ...propType, type: 'int' };
  }

  if (illegalTypes[type]) {
    throw new Error(
      `Invalid type '${type}' for prop '${propName}'.\n${illegalTypes[type]}`
    );
  }

  return propType;
};

function transformPropTypes(propTypes, propTypesMeta = {}) {
  // 'propTypes' is a string when 'A.propTypes = B.propTypes;'
  if (typeof propTypes === 'string') {
    return propTypes;
  }

  return Object.entries(propTypes).reduce((accum, [propName, propType]) => {
    const meta = propTypesMeta[propName];
    const transformedProp = transformSingleProp(propName, propType, meta);
    const newProp = transformedProp ? { [propName]: transformedProp } : {};

    return { ...accum, ...newProp };
  }, {});
}

module.exports = transformPropTypes;
