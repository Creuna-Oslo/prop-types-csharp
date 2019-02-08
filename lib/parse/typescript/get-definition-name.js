const { match, get } = require('kompis');
const t = require('@babel/types');

module.exports = match(
  [t.isIdentifier, get('name')],
  [t.isTSQualifiedName, n => `${n.left.name}.${n.right.name}`]
);
