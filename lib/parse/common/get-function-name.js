const { get, match } = require('kompis');
const t = require('@babel/types');

const getName = match(
  [t.isIdentifier, get('name')],
  [
    t.isMemberExpression,
    ({ object, property }) => `${getName(object)}.${getName(property)}`
  ]
);

module.exports = callExpression => getName(callExpression.callee);
