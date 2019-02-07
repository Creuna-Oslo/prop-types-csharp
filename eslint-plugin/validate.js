const t = require('@babel/types');

const allowedMetaTypes = require('../lib/meta-types');
const getInvalidPropTypes = require('./get-invalid-prop-types');
const isEquivalent = require('../lib/utils/is-equivalent-string');
const matchNode = require('../lib/utils/match-node');
const messages = require('./messages');

module.exports = ({
  bodyNode,
  context,
  exportDeclarations,
  metaTypes, // Literal node or js object with ObjectProperty nodes as values
  propTypes,
  propNames
}) => {
  if (t.isLiteral(metaTypes, { value: 'exclude' })) return;

  if (t.isLiteral(metaTypes)) {
    context.report({
      node: metaTypes,
      message: messages.badExclude(metaTypes.value)
    });
  }

  if (exportDeclarations.length > 1) {
    exportDeclarations.forEach(declaration => {
      context.report({
        node: declaration,
        message: messages.tooManyExports()
      });
    });
  } else if (!exportDeclarations.length) {
    context.report({
      node: bodyNode,
      message: messages.noExport()
    });
  } else {
    const componentName = exportDeclarations[0].name;
    propNames.forEach(prop => {
      if (isEquivalent(prop.name)(componentName)) {
        context.report({
          node: prop,
          message: messages.propNameCollision()
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

  if (!t.isLiteral(metaTypes)) {
    Object.values(metaTypes).forEach(node => {
      const onNoMatch = () => {
        context.report({
          node,
          message: messages.badMeta()
        });
      };

      matchNode(
        node,
        {
          // NOTE: Although empty the 'Identifier' and 'ObjectExpression' matchers ensure that these types are considered valid
          Identifier: () => {},
          ObjectExpression: () => {},
          Literal: () => {
            if (!allowedMetaTypes[node.value]) {
              context.report({
                node,
                message: messages.badStringLiteral(node.value)
              });
            }
          },
          ArrayExpression: () => {
            const [element] = node.elements;
            if (t.isLiteral(element) && !allowedMetaTypes[element]) {
              context.report({
                node,
                message: messages.badStringLiteral(element.value)
              });
            }
          }
        },
        onNoMatch
      );
    });
  }
};
