const { assign, get, id, isSome, map, match } = require('kompis');
const { otherwise, Pipe, reduce } = require('kompis');

const t = require('@babel/types');

const { throwError } = require('../../utils/error-handling');
const parseCallExpression = require('./parse-call-expression');

const parseArrayElement = match(
  [isSome(t.isStringLiteral, t.isNumericLiteral), get('value')],
  [otherwise, node => throwError(`Unsupported ${node.type} in PropTypes.oneOf`)]
);

const parseProperty = meta => ({ key, value }) => ({
  [key.name]: parseType(value, get(`children.${key.name}`)(meta))
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

module.exports = function(propTypesNode, propTypesMeta = {}) {
  return get('properties', [])(propTypesNode).reduce((accum, node) => {
    const propName = node.key.name;
    const type = parseType(node.value, propTypesMeta[propName]);

    return Object.assign(accum, type ? { [propName]: type } : {});
  }, {});
};
