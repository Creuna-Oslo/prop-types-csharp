const traverse = require('@babel/traverse').default;
const t = require('babel-types');

module.exports = function({ componentName, requirePropTypes, syntaxTree }) {
  let propTypesIdentifier,
    propTypesAST,
    propTypesMeta = {};

  traverse(syntaxTree, {
    // Get PropTypes variable name from import statement.
    ImportDeclaration(path) {
      if (path.get('source').isStringLiteral({ value: 'prop-types' })) {
        propTypesIdentifier = path.node.specifiers[0].local.name;
      }
    },

    // Replace references in 'oneOf' with value literals
    CallExpression(path) {
      const callee = path.get('callee');

      if (
        !callee.isMemberExpression() ||
        !callee.get('object').isIdentifier({ name: propTypesIdentifier }) ||
        !callee.get('property').isIdentifier({ name: 'oneOf' })
      ) {
        return;
      }

      const parent = path.findParent(parent => parent.isObjectProperty());
      const propName = parent.node.key.name;
      const oneOfArgument = path.node.arguments[0];

      const missingLiteralError = argumentName =>
        new Error(
          `Couldn't resolve value for prop '${propName}'. Make sure '${argumentName}' is defined in the above file.`
        );

      // Reference to an array
      if (t.isIdentifier(oneOfArgument)) {
        if (!path.scope.hasBinding(oneOfArgument.name)) {
          throw missingLiteralError(oneOfArgument.name);
        }

        // Class components have their bindings nested inside a key equal to the class name
        const bindings = path.scope.hasOwnBinding(oneOfArgument.name)
          ? path.scope.bindings
          : path.scope.bindings[componentName].scope.bindings;

        const arrayLiteral = bindings[oneOfArgument.name].path.node.init;

        path.replaceWith(t.callExpression(path.node.callee, [arrayLiteral]));
        return;
      }

      // Object.keys, Object.values
      if (
        t.isCallExpression(oneOfArgument) &&
        t.isMemberExpression(oneOfArgument.callee) &&
        t.isIdentifier(oneOfArgument.callee.object, { name: 'Object' })
      ) {
        const argument = oneOfArgument.arguments[0];
        const calleeName = oneOfArgument.callee.property.name;

        if (!path.scope.hasBinding(argument.name)) {
          throw missingLiteralError(argument.name);
        }

        // Class components have their bindings nested inside a key equal to the class name
        const bindings = path.scope.hasOwnBinding(argument.name)
          ? path.scope.bindings
          : path.scope.bindings[componentName].scope.bindings;

        const objectLiteral = bindings[argument.name].path.node.init;

        const { properties } = objectLiteral;
        let enumValues;

        switch (calleeName) {
          case 'keys':
            enumValues = properties.map(p => t.stringLiteral(p.key.name));
            break;
          case 'values':
            enumValues = properties.map(p => p.value);
            break;
          default:
            throw new Error(
              `Unsupported method 'Object.${calleeName}' for '${
                parent.node.key.name
              }'`
            );
        }

        path.replaceWith(
          t.callExpression(path.node.callee, [t.arrayExpression(enumValues)])
        );
      }
    }
  });

  traverse(syntaxTree, {
    AssignmentExpression(path) {
      const left = path.get('left');

      if (
        !t.isMemberExpression(left) ||
        !left.get('object').isIdentifier({ name: componentName })
      ) {
        return;
      }

      // Get propTypes for functional component
      if (left.get('property').isIdentifier({ name: 'propTypes' })) {
        propTypesAST = t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.identifier(componentName),
            path.node.right
          )
        );
        path.skip();
      }

      if (left.get('property').isIdentifier({ name: 'propTypesMeta' })) {
        propTypesMeta = path.node.right.properties.reduce(
          (accum, property) =>
            Object.assign({}, accum, {
              [property.key.name]: property.value.value
            }),
          {}
        );
      }
    }
  });

  if (propTypesAST) {
    return { propTypesAST, propTypesIdentifier, propTypesMeta };
  }

  traverse(syntaxTree, {
    ClassProperty(path) {
      const key = path.get('key');

      if (key.isIdentifier({ name: 'propTypes' })) {
        propTypesAST = t.expressionStatement(
          t.assignmentExpression(
            '=',
            t.identifier(componentName),
            path.node.value
          )
        );
      }

      if (key.isIdentifier({ name: 'propTypesMeta' })) {
        propTypesMeta = path.node.value.properties.reduce(
          (accum, property) =>
            Object.assign({}, accum, {
              [property.key.name]: property.value.value
            }),
          {}
        );
      }

      path.skip();
    }
  });

  if (propTypesAST) {
    return { propTypesAST, propTypesIdentifier, propTypesMeta };
  }

  if (requirePropTypes) {
    throw new Error('PropTypes not found');
  }
};
