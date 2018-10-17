const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

// Replace references in 'oneOf' with value literals
module.exports = function({ componentName, propTypesMeta, syntaxTree }) {
  traverse(syntaxTree, {
    CallExpression(path) {
      const callee = path.get('callee');

      if (!callee.isIdentifier({ name: 'oneOf' })) {
        return;
      }

      const parent = path.findParent(parent => parent.isObjectProperty());
      const propName = parent.node.key.name;
      const oneOfArgument = path.node.arguments[0];
      const meta = propTypesMeta[propName];

      // Abort if meta type is 'exclude'. Actual removal of the node happens later, in 'transform-prop-types.js'
      if (meta && meta.type === 'exclude') {
        return;
      }

      // Inline oneOf, like PropTypes.oneOf([1,2,3])
      // if (t.isArrayExpression(oneOfArgument)) {
      //   path.replaceWith(oneOfArgument);
      // }

      const missingLiteralError = argumentName =>
        new Error(
          `Couldn't resolve enum value for prop '${propName}'. Make sure '${argumentName}' is defined in the above file.`
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

        if (!arrayLiteral) {
          throw missingLiteralError(oneOfArgument.name);
        }

        path.node.arguments = [arrayLiteral];
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

        if (!objectLiteral) {
          throw missingLiteralError(argument.name);
        }

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

        path.node.arguments = [t.arrayExpression(enumValues)];
      }
    }
  });
};
