const t = require('babel-types');

const messages = require('./messages');

const illegalTypes = {
  array: messages.array,
  object: messages.object,
  oneOfType: messages.oneOfType
};

module.exports = (objectExpression, scope) => {
  // console.log(scope.childScopes[0].variables[0].references[0]);
  const variablesInScope =
    scope.childScopes.length &&
    scope.childScopes[0].type === 'module' &&
    scope.childScopes[0].variables;

  return objectExpression.properties.reduce((accum, objectProperty) => {
    const key = objectProperty.key.name;
    const value = objectProperty.value;

    // Function calls not coming from PropTypes are illegal. Detect this by checking if the callee is an identifier (PropTypes.something is a MemberExpression).
    if (t.isCallExpression(value) && t.isIdentifier(value.callee)) {
      return Object.assign(accum, {
        [key]: { node: value, message: messages.illegalFunctionCall }
      });
    }

    // propTypeNode might be a CallExpression node (like in 'PropTypes.arrayOf()'), in which case the propType node will be accessible in obectProperty.value.callee. If not, the node is a MemberExpression, and the node is accessible in objectProperty.value.
    const propTypeNode = objectProperty.value.callee || objectProperty.value;

    if (t.isMemberExpression(propTypeNode)) {
      const isRequired =
        t.isMemberExpression(propTypeNode.object) &&
        t.isIdentifier(propTypeNode.property, { name: 'isRequired' });

      // If .isRequired is used, 'propTypeNode.object' will be another MemberExpression. The type name will be accessible in the 'property' property of 'propTypeNode.object'.
      const propTypeName = isRequired
        ? propTypeNode.object.property.name
        : propTypeNode.property.name;

      if (illegalTypes[propTypeName]) {
        accum[key] = {
          node: propTypeNode.property,
          message: illegalTypes[propTypeName]
        };
      }

      // Check for references inside PropTypes.oneOf. Run checks only if there are defined variables in scope. Undefined variables are caught by 'no-undef', which every sane person should be using.
      if (
        t.isCallExpression(value) &&
        propTypeName === 'oneOf' &&
        variablesInScope.length
      ) {
        const [argument] = value.arguments;

        // Check references to arrays
        if (t.isIdentifier(argument)) {
          const hasLiteral = variablesInScope.some(
            variable =>
              variable.name === argument.name &&
              t.isArrayExpression(variable.references[0].writeExpr)
          );

          if (!hasLiteral) {
            accum[key] = {
              node: argument,
              message: messages.importedArrayReference
            };
          }
        }

        // Check references to objects in Object.keys and Object.values
        if (
          t.isCallExpression(argument) &&
          t.isMemberExpression(argument.callee) &&
          argument.callee.object.name === 'Object' &&
          ['keys', 'values'].includes(argument.callee.property.name)
        ) {
          const [objectMethodArgument] = argument.arguments;
          const hasLiteral = variablesInScope.some(
            variable =>
              variable.name === objectMethodArgument.name &&
              t.isObjectExpression(variable.references[0].writeExpr)
          );

          if (!hasLiteral) {
            accum[key] = {
              node: objectMethodArgument,
              message: messages.importedObjectReference
            };
          }
        }
      }
    }

    return accum;
  }, {});
};
