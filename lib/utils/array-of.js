const childIsArray = node => node.argument && node.argument.type === 'arrayOf';

// Returns the type of the innermost node that's not an 'arrayOf' node
const getInnerNode = node =>
  childIsArray(node) ? getInnerNode(node.argument) : node.argument;

// Merges 'newInnerValue' with the 'argument' property of the innermost 'arrayOf' node
const assignToInnerArray = (node, newInnerValue) =>
  Object.assign(
    {},
    node,
    childIsArray(node)
      ? { argument: assignToInnerArray(node.argument, newInnerValue) }
      : newInnerValue
  );

module.exports = {
  getInnerNode,
  assignToInnerArray
};
