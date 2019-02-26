const t = require('@babel/types');

const isMemberExpression = (objectName, propertyName) => node =>
  t.isIdentifier(node.object, { name: objectName }) &&
  t.isIdentifier(node.property, { name: propertyName });

module.exports = isMemberExpression;
