const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const capitalize = require('../utils/capitalize');
const isIdentifierArray = require('../utils/is-identifier-array');

// This function mutates the provided syntax tree, doing the following for every ObjectProperty node
//  - Checks whether the ObjectPropety value is an array or an object
//  - If it is, a new AssignmentNode is added to the top level of the syntax tree and the original object or array is replaced with a reference to the new AssignmentNode
//     Basically, turning this:
//       Component = {
//         propA: { a: string },
//         propB: [{ b: string }],
//         propC: [ 1, 2 ],
//       };

//     Into this:
//       Component = {
//         propA: PropA,
//         propB: [PropB],
//         propC: PropC
//       };
//       PropA = { a: string };
//       PropB = { b: string };
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

      // At this point, both 'oneOf' and 'arrayOf' are represented by array expressions, the difference between them being the type of elements they hold. Array expressions representing 'oneOf' will only contain Literal nodes, while 'arrayOf' can hold anything but Literal nodes. These two types are treadet differently, which is why the 'isArrayType' flag is initialized with a test for array element type.
      const isArrayType =
        t.isArrayExpression(typeNode) && !t.isLiteral(typeNode.elements[0]);
      const isRequired =
        isMember &&
        t.isIdentifier(path.node.value.property, { name: 'isRequired' });

      // Abort if value is identifier or an array containing an idenfitier, because in that case the node is already compatible with the stringification step
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
        `${className}_` + capitalize(propName) + (isArrayType ? 'Item' : '')
      );
      const definitionValue = isArrayType ? typeNode.elements[0] : typeNode;

      // Create new nodes in Program node for new type definitions
      path
        .findParent(parent => t.isProgram(parent))
        .pushContainer(
          'body',
          t.expressionStatement(
            t.assignmentExpression('=', definitionName, definitionValue)
          )
        );

      const definitionReference = isArrayType
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
