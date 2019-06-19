const { getInnerNode } = require('../utils/array-of');

const basicTypes = ['int', 'float', 'string', 'bool'];

const getTypes = obj =>
  Object.entries(obj).reduce(
    (accum, [_key, value]) => accum.concat(getType(value)),
    []
  );

function getType(node) {
  if (node.type === 'shape') return getTypes(node.children);
  if (node.type === 'oneOf') return [];
  if (['arrayOf', 'objectOf'].includes(node.type))
    return getType(getInnerNode(node));
  return node.type;
}

module.exports = propTypes => {
  return getTypes(propTypes).filter(type => !basicTypes.includes(type));
};
