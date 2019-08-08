const { assign, get, id, isSome, map, match } = require('kompis');
const { otherwise, Pipe, reduce } = require('kompis');
const t = require('@babel/types');

const { throwError } = require('../../utils/error-handling');
const Node = require('../../node');
const parseCallExpression = require('./parse-call-expression');
const isComponentReference = require('./is-component-reference');

const typesToStrip = ['element', 'elementType', 'func', 'node'];

const parseArrayElement = match(
  [isSome(t.isStringLiteral, t.isNumericLiteral), get('value')],
  [otherwise, node => throwError(`Unsupported ${node.type} in PropTypes.oneOf`)]
);

const parseMemberExpression = meta => node => {
  // NOTE: This matches 'SomeComponent.propTypes'
  if (isComponentReference(node)) {
    return Node({ type: 'ref', ref: node.object.name });
  }

  return Node({
    ...parseType(node.object, meta),
    isRequired: t.isIdentifier(node.property, { name: 'isRequired' })
  });
};

const parseIdentifier = meta => ({ name }) => {
  const typeName = name === 'number' ? 'int' : name;
  return typesToStrip.includes(name) ? meta : Node({ type: typeName, ...meta });
};

const Shape = children => Node({ type: 'shape', children });
const parseProperty = meta => ({ key, value }) => {
  const type = parseType(value, get(key.name)(meta));
  return type ? { [key.name]: type } : {};
};
const parseObjectExpression = meta =>
  Pipe(get('properties', []), reduce(assign, {}, parseProperty(meta)), Shape);

function parseType(node, meta = {}) {
  if (meta.type === 'exclude') return;

  const parsedType = match(
    [t.isArrayExpression, Pipe(get('elements'), map(parseArrayElement))],
    [t.isCallExpression, parseCallExpression(meta, parseType)],
    [t.isIdentifier, parseIdentifier(meta)],
    [t.isObjectExpression, parseObjectExpression(meta)],
    [t.isMemberExpression, parseMemberExpression(meta)],
    [otherwise, id]
  )(node);

  // NOTE: 'parsedType' can be undefined, a Node or an array
  if (parsedType && parsedType.type) return Node(parsedType);

  return Object.keys(parsedType || {}).length ? parsedType : undefined;
}

module.exports = function(propTypesNode, propTypesMeta = {}) {
  return get('properties', [])(propTypesNode).reduce((accum, node) => {
    const propName = node.key.name;
    try {
      const type = parseType(node.value, propTypesMeta[propName]);
      return Object.assign(accum, type && { [propName]: type });
    } catch (error) {
      throw new Error(`Invalid type for prop '${propName}':\n${error.message}`);
    }
  }, {});
};
