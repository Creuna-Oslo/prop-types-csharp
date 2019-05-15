const { throwError } = require('./utils/error-handling');
const { getInnerNode, assignToInnerArray } = require('./utils/array-of');
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

const isShape = ({ type } = {}) => ['exact', 'shape'].includes(type);
const shouldStrip = ({ type } = {}) => typesToStrip.includes(type);
const validateType = type =>
  illegalTypes[type] && throwError(`('${type}').\n${illegalTypes[type]}`);

const transformSingleProp = (typeNode, meta = {}) => {
  // Convert 'shape' to 'exact'
  const type = typeNode.type === 'exact' ? 'shape' : typeNode.type;
  const { children } = typeNode;

  if (meta.type === 'exclude') return;
  if (shouldStrip(typeNode) || shouldStrip(children)) return;

  if (isShape(typeNode) || isShape(children)) {
    const parsedChildren = isShape(children)
      ? transformSingleProp(children, meta.children)
      : transformPropTypes(meta.children)(children);
    return { ...typeNode, type, children: parsedChildren };
  }

  if (Object.keys(meta).length) {
    return { ...typeNode, ...meta };
  }

  if (type === 'number') {
    return { ...typeNode, type: 'int' };
  }

  if (type === 'arrayOf' && getInnerNode(typeNode).type === 'number') {
    return assignToInnerArray(typeNode, { children: { type: 'int' } });
  }

  validateType(type);
  validateType((children || {}).type);

  return typeNode;
};

function transformPropTypes(propTypesMeta = {}) {
  return propTypes =>
    Object.entries(propTypes).reduce((accum, [propName, typeNode]) => {
      try {
        const meta = propTypesMeta[propName];
        const transformedProp = transformSingleProp(typeNode, meta);
        const newProp = transformedProp ? { [propName]: transformedProp } : {};

        return { ...accum, ...newProp };
      } catch (error) {
        throw new Error(`Invalid type for prop '${propName}' ${error.message}`);
      }
    }, {});
}

module.exports = transformPropTypes;
