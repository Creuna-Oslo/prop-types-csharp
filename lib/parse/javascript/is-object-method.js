const t = require('@babel/types');

module.exports = callExpression =>
  t.isMemberExpression(callExpression.callee) &&
  t.isIdentifier(callExpression.callee.object, { name: 'Object' });
