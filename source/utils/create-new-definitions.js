const traverse = require('@babel/traverse').default;
const t = require('babel-types');

const capitalize = require('./capitalize');

// This function mutates the provided syntax tree, doing the following
//  - Finds any calls to 'oneOf' and 'shape'
//  - If any, adds new nodes to the syntaxTree for types in the arguments of these calls
//     Basically, turning this:
//       Component = {
//         propA: string,
//         propB: shape({ a: string })
//       };

//     Into this:
//       Component = {
//         propA: string,
//         propB: PropB
//       };
//       PropB = {
//         a: string
//       };
module.exports = function({ syntaxTree }) {
  traverse(syntaxTree, {
    CallExpression(path) {
      const argument = path.node.arguments[0];
      const isArrayOf = path.findParent(
        parent =>
          t.isCallExpression(parent) &&
          parent.get('callee').isIdentifier({ name: 'arrayOf' })
      );
      const isIdentifier = t.isIdentifier(argument);
      const isOneOf = path.get('callee').isIdentifier({ name: 'oneOf' });
      const isShape = path.get('callee').isIdentifier({ name: 'shape' });
      const prop = path.findParent(parent => t.isObjectProperty(parent));
      const propName = prop.node.key.name;
      const propDefinitionName =
        capitalize(propName) + (isArrayOf ? 'Item' : '');
      const program = path.findParent(parent => t.isProgram(parent));

      if (!isShape && !isOneOf) {
        return;
      }

      // Replace shape and oneOf with new definitions
      // Identifiers as shape are interpreted as a reference to the propTypes of another components (propTypes.shape(SomeComponent.propTypes)). If the call argument is an identifier, skip creating a new definition for it.
      if (!isIdentifier || isOneOf) {
        program.pushContainer(
          'body',
          t.expressionStatement(
            t.assignmentExpression(
              '=',
              t.identifier(propDefinitionName),
              argument
            )
          )
        );
      }

      path.replaceWith(
        isIdentifier ? argument : t.identifier(propDefinitionName)
      );
    }
  });
};
