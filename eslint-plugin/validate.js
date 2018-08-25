const t = require('babel-types');

const allowedMetaTypes = require('./allowed-meta-types');
const messages = require('./messages');

module.exports = ({
  bodyNode,
  context,
  exportDeclarations,
  metaTypes,
  propNames,
  invalidPropTypes
}) => {
  if (exportDeclarations.length > 1) {
    exportDeclarations.forEach(declaration => {
      context.report({
        node: declaration,
        message: messages.tooManyExports
      });
    });
  } else if (!exportDeclarations.length) {
    context.report({
      node: bodyNode,
      message: messages.noExport
    });
  } else {
    const componentName = exportDeclarations[0].name;
    propNames.forEach(prop => {
      if (prop.name.toLowerCase() === componentName.toLowerCase()) {
        context.report({
          node: prop,
          message: messages.propNameCollision
        });
      }
    });
  }

  Object.entries(invalidPropTypes)
    .filter(([key]) => !metaTypes[key])
    .forEach(([_key, { node, message }]) => {
      context.report({ node, message });
    });

  Object.values(metaTypes).forEach(node => {
    if (t.isLiteral(node) && !allowedMetaTypes.strings[node.value]) {
      context.report({
        node,
        message: messages.badStringLiteral,
        data: { value: node.value }
      });
    }

    if (
      t.isCallExpression(node) &&
      !allowedMetaTypes.functions[node.callee.name]
    ) {
      context.report({
        node,
        message: messages.badFunctionCall,
        data: { value: node.value }
      });
    }
  });
};
