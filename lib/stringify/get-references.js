const { getInnerNode } = require('../utils/array-of');

const getReferences = obj =>
  Object.entries(obj).reduce(
    (accum, [_key, value]) => accum.concat(getReference(value)),
    []
  );

function getReference(node) {
  if (node.type === 'ref') return node.ref;
  if (node.type === 'shape') return getReferences(node.children);
  if (['arrayOf', 'objectOf'].includes(node.type))
    return getReference(getInnerNode(node));
  return [];
}

module.exports = getReferences;
