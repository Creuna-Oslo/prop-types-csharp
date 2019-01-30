const { assign, get, id, isSome, map, match } = require('kompis');
const { otherwise, Pipe, reduce } = require('kompis');

const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const { throwError } = require('../../utils/error-handling');
const parseCallExpression = require('./parse-call-expression');

const parseArrayElement = match(
  [isSome(t.isStringLiteral, t.isNumericLiteral), get('value')],
  [otherwise, node => throwError(`Unsupported ${node.type} in PropTypes.oneOf`)]
);

const parseProperty = meta => p => ({
  [p.key.name]: parseType(p.value, get(`argument.${p.key.name}`)(meta))
});

const parseMemberExpression = meta => node => ({
  ...parseType(node.object, meta),
  isRequired: t.isIdentifier(node.property, { name: 'isRequired' })
});

function parseType(node, meta = {}) {
  return match(
    [t.isArrayExpression, Pipe(get('elements'), map(parseArrayElement))],
    [t.isCallExpression, parseCallExpression(meta, parseType)],
    [t.isIdentifier, ({ name }) => ({ type: name })],
    [
      t.isObjectExpression,
      Pipe(get('properties', []), reduce(assign, {}, parseProperty(meta)))
    ],
    [t.isMemberExpression, parseMemberExpression(meta)],
    [otherwise, id]
  )(node);
}

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
          const type = parseType(path.node.value, propTypesMeta[propName]);

          if (type) {
            propTypes[propName] = type;
          }

          // Skip traversing children of ObjectProperty nodes to avoid writing properties from 'shape' etc to the top level propTypes object
          path.skip();
        }
      });
    }
  });

  return propTypes;
};
