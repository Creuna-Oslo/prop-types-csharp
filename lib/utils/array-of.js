const childIsArray = node => node.children && node.children.type === 'arrayOf';

// Returns the type of the innermost node that's not an 'arrayOf' node
const getInnerNode = node =>
  childIsArray(node) ? getInnerNode(node.children) : node.children;

// Merges 'newInnerValue' with the 'children' property of the innermost 'arrayOf' node
const assignToInnerArray = (node, newInnerValue) =>
  Object.assign(
    {},
    node,
    childIsArray(node)
      ? { children: assignToInnerArray(node.children, newInnerValue) }
      : newInnerValue
  );

module.exports = {
  getInnerNode,
  assignToInnerArray
};
