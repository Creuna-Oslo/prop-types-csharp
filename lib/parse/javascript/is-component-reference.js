const t = require('@babel/types');

module.exports = node =>
  t.isMemberExpression(node) &&
  t.isIdentifier(node.property, { name: 'propTypes' });
