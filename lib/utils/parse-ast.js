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
    () => {
      throw new Error(`Unsupported ${node.type} in PropTypes.oneOf`);
    }
  );
};

const parseType = (node, meta = {}) => {
  return getNodeOfType(
    node,
    {
      ArrayExpression: ({ elements }) => elements.map(parseArrayElement),
      // Arguments to PropTypes methods only accept one argument (destructured into 'argument')
      CallExpression: path => {
        const {
          callee,
          arguments: [argument]
        } = path;
        // Handle component references in 'shape'
        if (
          callee.name === 'shape' &&
          t.isMemberExpression(argument) &&
          t.isIdentifier(argument.property, { name: 'propTypes' })
        ) {
          return parseType(argument.object, meta);
        }

        // 'instanceOf' is included here because it is automatically stripped in 'transform-prop-types.js' and should not throw an error
        if (
          !['arrayOf', 'oneOf', 'shape', 'instanceOf'].includes(callee.name) &&
          meta.type !== 'exclude'
        ) {
          throw new Error(`Invalid function call '${callee.name}'.`);
        }

        return {
          type: callee.name,
          argument: parseType(argument, meta)
        };
      },
      Identifier: ({ name }) => ({ type: name }),
      ObjectExpression: ({ properties }) =>
        properties.reduce(
          (accum, property) => ({
            ...accum,
            [property.key.name]: parseType(
              property.value,
              meta.argument && meta.argument[property.key.name]
            )
          }),
          {}
        ),
      MemberExpression: node => ({
        ...parseType(node.object, meta),
        isRequired: t.isIdentifier(node.property, { name: 'isRequired' })
      })
    },
    () => {
      return node;
    }
  );
};

module.exports = function(syntaxTree, propTypesMeta = {}) {
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
          propTypes[propName] = parseType(
            path.node.value,
            propTypesMeta[propName]
          );

          // Skip traversing children of ObjectProperty nodes to avoid writing properties from 'shape' etc to the top level propTypes object
          path.skip();
        }
      });
    }
  });

  return propTypes;
};
