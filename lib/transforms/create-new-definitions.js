const traverse = require('@babel/traverse').default;
const t = require('babel-types');

const capitalize = require('../utils/capitalize');
const isIdentifierArray = require('../utils/is-identifier-array');

// This function mutates the provided syntax tree, doing the following for every ObjectProperty node
//  - Checks whether the ObjectPropety value is an array or an object
//  - If it is, a new AssignmentNode is added to the top level of the syntax tree and the original object or array is replaced with a reference to the new AssignmentNode
//     Basically, turning this:
//       Component = {
//         propA: string,
//         propB: [{ a: string }],
//         propC: [ 1, 2 ]
//       };

//     Into this:
//       Component = {
//         propA: string,
//         propB: [PropB],
//         propC: PropC
//       };
//       PropB = { a: string };
//       PropC = [ 1, 2 ];
module.exports = function({ syntaxTree }) {
  traverse(syntaxTree, {
    ObjectProperty(path) {
      const propName = path.node.key.name;
      const isMember = t.isMemberExpression(path.node.value); // Hapens for string.isRequired etc
      const typeNode = isMember ? path.node.value.object : path.node.value;
      const assignmentParent = path.findParent(parent =>
        t.isAssignmentExpression(parent)
      );
      const className = assignmentParent.node.left.name;

      // Enums are represented as ArrayExpression nodes containing Literal nodes. Enums should not treated as arrays .
      const isArray =
        t.isArrayExpression(typeNode) && !t.isLiteral(typeNode.elements[0]);
      const isRequired =
        isMember &&
        t.isIdentifier(path.node.value.property, { name: 'isRequired' });

      // Abort if value is identifier or an array containing an idenfitier
      if (t.isIdentifier(typeNode) || isIdentifierArray(typeNode)) {
        return;
      }

      const isComponentReference =
        t.isMemberExpression(typeNode) &&
        typeNode.property.name === 'propTypes';

      if (isComponentReference) {
        path.get('value').replaceWith(typeNode.object);
        return;
      }

      // Prepend the component name to avoid name collisions. Append 'Item' for definitions in array
      const definitionName = t.identifier(
        `${className}_` + capitalize(propName) + (isArray ? 'Item' : '')
      );
      const definitionValue = isArray ? typeNode.elements[0] : typeNode;

      // Create new nodes in Program node for new type definitions
      path
        .findParent(parent => t.isProgram(parent))
        .pushContainer(
          'body',
          t.expressionStatement(
            t.assignmentExpression('=', definitionName, definitionValue)
          )
        );

      const definitionReference = isArray
        ? t.arrayExpression([definitionName])
        : definitionName;

      path
        .get('value')
        .replaceWith(
          isRequired
            ? t.memberExpression(
                definitionReference,
                t.identifier('isRequired')
              )
            : definitionReference
        );
    }
  });
};
