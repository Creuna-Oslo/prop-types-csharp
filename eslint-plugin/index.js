const t = require('@babel/types');

const validate = require('./validate');

const getPropTypesMeta = node => {
  if (!node) return {};
  // Manual type check for string because ESTree has no concept of StringLiteral:
  if (t.isLiteral(node) && typeof node.value === 'string') return node;
  if (!node.properties) return {};

  return node.properties.reduce(
    (accum, property) =>
      Object.assign(accum, { [property.key.name]: property.value }),
    {}
  );
};

const getPropNames = objectExpression => {
  return objectExpression.properties.map(property => property.key);
};

module.exports = {
  rules: {
    all: {
      create: function(context) {
        let exportDeclarations = [];
        let metaTypes = {};
        let propTypes;
        let propNames = [];

        if (!context.getFilename().includes('.jsx')) {
          return {};
        }

        // The exported visitor functions gather information about propTypes, propTypesMeta and file exports. The 'Program:exit' visitor will execute last. When it runs, the validate function is called with the gathered data. 'validate' will report any errors to eslint via the 'context' object.
        return {
          'Program:exit': node => {
            validate({
              bodyNode: node,
              context,
              exportDeclarations,
              metaTypes,
              propTypes,
              propNames
            });
          },
          ExportDefaultDeclaration: node => {
            exportDeclarations = exportDeclarations.concat(node.declaration);
          },
          ExportNamedDeclaration: node => {
            exportDeclarations = exportDeclarations.concat(
              node.specifiers.map(specifier => specifier.exported)
            );
          },
          ClassProperty: node => {
            if (
              t.isIdentifier(node.key, { name: 'propTypes' }) &&
              t.isObjectExpression(node.value)
            ) {
              propTypes = node.value;
              propNames = propNames.concat(getPropNames(node.value));
            }

            if (t.isIdentifier(node.key, { name: 'propTypesMeta' })) {
              metaTypes = getPropTypesMeta(node.value);
            }
          },
          AssignmentExpression: node => {
            if (
              t.isMemberExpression(node.left) &&
              node.left.property.name === 'propTypes' &&
              t.isObjectExpression(node.right)
            ) {
              propTypes = node.right;
              propNames = propNames.concat(getPropNames(node.right));
            }

            if (
              t.isMemberExpression(node.left) &&
              node.left.property.name === 'propTypesMeta'
            ) {
              metaTypes = getPropTypesMeta(node.right);
            }
          }
        };
      }
    }
  }
};
