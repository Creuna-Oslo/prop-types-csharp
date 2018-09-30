const t = require('@babel/types');

const allowedMetaTypes = require('../lib/meta-types');
const getInvalidPropTypes = require('./get-invalid-prop-types');
const messages = require('./messages');

module.exports = ({
  bodyNode,
  context,
  exportDeclarations,
  metaTypes,
  propTypes,
  propNames
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

  if (propTypes) {
    const invalidPropTypes = getInvalidPropTypes(propTypes, context.getScope());

    const recursiveValidatePropTypes = (propTypes, metaTypes = {}) => {
      Object.entries(propTypes)
        .filter(([key]) => !metaTypes[key])
        .forEach(([key, { node, message }]) => {
          // If the object doesn't have a node or a message, the object is an object literal from PropTypes.shape. Validate propTypes for this object literal:
          if (!node || !message) {
            recursiveValidatePropTypes(propTypes[key], metaTypes[key]);
            return;
          }

          context.report({ node, message });
        });
    };

    recursiveValidatePropTypes(invalidPropTypes, metaTypes);
  }

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
