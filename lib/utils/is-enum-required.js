const t = require('babel-types');

module.exports = (assignmentExpressions, className) => {
  return assignmentExpressions
    .filter(assignmentNode => !t.isArrayExpression(assignmentNode.right))
    .some(assignmentNode =>
      assignmentNode.right.properties.find(
        node =>
          // node is an ObjectProperty node
          t.isMemberExpression(node.value) &&
          t.isIdentifier(node.value.object, { name: className }) &&
          t.isIdentifier(node.value.property, { name: 'isRequired' })
      )
    );
};
