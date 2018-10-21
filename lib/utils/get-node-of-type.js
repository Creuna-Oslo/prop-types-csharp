/* istanbul ignore next*/
const noop = () => {};

// Arguments:
// node: Babel node
// typeHandlers: Object where the object keys must match babel type names and the values are functions. If 'node.type' matches any of the object keys, that function is executed with the node as the only argument
// onNoMatch: will be run if ny type handler is provide for 'node.type'
module.exports = (node, typeHandlers, onNoMatch = noop) => {
  if (!node || !typeHandlers[node.type]) {
    return onNoMatch(node);
  }

  return typeHandlers[node.type](node);
};
