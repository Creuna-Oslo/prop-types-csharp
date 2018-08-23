const t = require('babel-types');

const illegalTypes = {
  object: 'Unsupported type "object". Replace with "shape" or add meta type.',
  array: 'Unsupported type "array". Replace with "arrayOf" or add meta type'
};

const allowedStringTypes = ['exclude', 'float', 'int'];

const getPropTypesMeta = objectExpression => {
  return objectExpression.properties.reduce(
    (accum, property) =>
      Object.assign(accum, { [property.key.name]: property.value }),
    {}
  );
};

const getPropNames = objectExpression => {
  return objectExpression.properties.map(property => property.key);
};

const getInvalidPropTypes = objectExpression => {
  return objectExpression.properties.reduce((accum, property) => {
    const key = property.key.name;
    const prop = property.value;

    if (t.isMemberExpression(prop) && illegalTypes[prop.property.name]) {
      accum[key] = {
        node: prop.property,
        message: illegalTypes[prop.property.name]
      };
    }

    return accum;
  }, {});
};

module.exports = {
  rules: {
    'no-ambiguous-types': {
      create: function(context) {
        let exportDeclarations = [];
        const metaTypes = {};
        const potentialProblems = {};
        let propNames = [];

        if (!context.getFilename().includes('.jsx')) {
          return {};
        }

        return {
          'Program:exit': node => {
            if (exportDeclarations.length > 1) {
              exportDeclarations.forEach(declaration => {
                context.report({
                  node: declaration,
                  message: `Too many exports. Couldn't get component name.`
                });
              });
            } else if (!exportDeclarations.length) {
              context.report({
                node,
                message: `No export statement. Couldn't get component name.`
              });
            } else {
              const componentName = exportDeclarations[0].name;
              propNames.forEach(prop => {
                if (prop.name.toLowerCase() === componentName.toLowerCase()) {
                  context.report({
                    node: prop,
                    message: `Prop can't have the same name as the component.`
                  });
                }
              });
            }

            Object.entries(potentialProblems)
              .filter(([key]) => !metaTypes[key])
              .forEach(([key, problem]) => {
                context.report(problem);
              });

            Object.values(metaTypes).forEach(type => {
              if (
                t.isLiteral(type) &&
                !allowedStringTypes.includes(type.value)
              ) {
                context.report({
                  node: type,
                  message: `Expected one of [${allowedStringTypes}] but got '${
                    type.value
                  }'.`
                });
              }
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
            if (t.isIdentifier(node.key, { name: 'propTypes' })) {
              Object.assign(potentialProblems, getInvalidPropTypes(node.value));
              propNames = propNames.concat(getPropNames(node.value));
            }

            if (t.isIdentifier(node.key, { name: 'propTypesMeta' })) {
              Object.assign(metaTypes, getPropTypesMeta(node.value));
            }
          },
          AssignmentExpression: node => {
            if (
              t.isMemberExpression(node.left) &&
              node.left.property.name === 'propTypes'
            ) {
              Object.assign(potentialProblems, getInvalidPropTypes(node.right));
              propNames = propNames.concat(getPropNames(node.right));
            }

            if (
              t.isMemberExpression(node.left) &&
              node.left.property.name === 'propTypesMeta'
            ) {
              Object.assign(metaTypes, getPropTypesMeta(node.right));
            }
          }
        };
      }
    }
  }
};
