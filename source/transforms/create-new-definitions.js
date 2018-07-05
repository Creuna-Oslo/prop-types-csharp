const traverse = require('@babel/traverse').default;
const t = require('babel-types');

const capitalize = require('../utils/capitalize');

// This function mutates the provided syntax tree, doing the following
//  - Finds any calls to 'oneOf' and 'shape'
//  - Checks whether it holds a reference
//  - If any matching calls are found and they don't hold a reference, new nodes are added to the syntaxTree for types in the arguments of these calls
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
      const isTypeReference =
        t.isMemberExpression(argument) &&
        argument.property.name === 'propTypes';
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

      // Generate new definitions from oneOf and shape
      if (!isTypeReference || isOneOf) {
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
        isTypeReference ? argument.object : t.identifier(propDefinitionName)
      );
    }
  });
};
