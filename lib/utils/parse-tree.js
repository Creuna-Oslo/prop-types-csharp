const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const getNodeOfType = require('./get-node-of-type');

const parseArrayElement = node => {
  return getNodeOfType(
    node,
    {
      StringLiteral: node => node.value,
      NumericLiteral: node => node.value
    },
    () => node
  );
};

const parseType = node => {
  return getNodeOfType(
    node,
    {
      ArrayExpression: ({ elements }) => elements.map(parseArrayElement),
      // Arguments to PropTypes methods only accept one argument (destructured into 'argument')
      CallExpression: ({ callee, arguments: [argument] }) => {
        // Handle component references in 'shape'
        if (
          callee.name === 'shape' &&
          t.isMemberExpression(argument) &&
          t.isIdentifier(argument.property, { name: 'propTypes' })
        ) {
          return parseType(argument.object);
        }

        return {
          type: callee.name,
          argument: parseType(argument)
        };
      },
      Identifier: ({ name }) => ({ type: name }),
      ObjectExpression: ({ properties }) =>
        properties.reduce(
          (accum, property) => ({
            ...accum,
            [property.key.name]: parseType(property.value)
          }),
          {}
        ),
      MemberExpression: node => ({
        ...parseType(node.object),
        isRequired: t.isIdentifier(node.property, { name: 'isRequired' })
      })
    },
    () => {
      return node;
    }
  );
};

module.exports = function(syntaxTree) {
  let propTypes;

  traverse(syntaxTree, {
    AssignmentExpression(path) {
      const value = path.node.right;

      // Component.propTypes = AnotherComponent.propTypes
      if (
        t.isMemberExpression(value) &&
        t.isIdentifier(value.property, { name: 'propTypes' })
      ) {
        propTypes = value.object.name;
        path.stop();
        return;
      }

      propTypes = {};

      path.get('right').traverse({
        ObjectProperty(path) {
          const propName = path.node.key.name;
          propTypes[propName] = parseType(path.node.value);

          // Skip traversing children of ObjectProperty nodes to avoid writing properties from 'shape' etc to the top level propTypes object
          path.skip();
        }
      });
    }
  });

  return propTypes;
};
