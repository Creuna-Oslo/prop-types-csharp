const { get } = require('kompis');
const t = require('@babel/types');

const getDefinitionName = require('./get-definition-name');
const matchNode = require('../../utils/match-node');
const Node = require('../../node');
const typeNodeName = require('./type-node-name');
const { throwError } = require('../../utils/error-handling');

// NOTE: JSX.Element is supposedly the thing typescript has that is most similar to PropTypes.node
const typesToStrip = ['JSX.Element'];

const handleTypeReference = (typeDeclarations, meta, newNode) => n => {
  const name = getDefinitionName(n.typeName);
  const types = typeDeclarations[name];

  if (typesToStrip.includes(name)) return;

  return !types
    ? newNode('ref', undefined, name) // When type isn't defined in file
    : types.some(t.isTSEnumMember)
    ? newNode('oneOf', types.map(get('initializer.value')))
    : parseTypes(types, meta, typeDeclarations);
};

const parseType = (typeNode, meta = {}, isRequired, typeDeclarations) => {
  const newNode = (type, children, ref) =>
    Node({ type, isRequired, children, ref });

  if (meta.type === 'exclude') return;

  return matchNode(
    typeNode,
    {
      TSArrayType: n =>
        newNode(
          'arrayOf',
          parseType(n.elementType, meta.children, false, typeDeclarations)
        ),
      TSBooleanKeyword: () => newNode('bool'),
      TSFunctionType: () => undefined,
      TSNumberKeyword: () => newNode(meta.type || 'int'),
      TSStringKeyword: () => newNode('string'),
      TSTypeLiteral: n =>
        newNode('shape', parseTypes(n.members, meta, typeDeclarations)),
      TSParenthesizedType: n =>
        parseType(n.typeAnnotation, meta, isRequired, typeDeclarations),
      TSTypeReference: handleTypeReference(typeDeclarations, meta, newNode)
    },
    n => throwError(`Type '${typeNodeName(n)}' is not supported.`)
  );
};

function parseTypes(types, meta = {}, typeDeclarations) {
  return types.reduce((accum, typeNode) => {
    const name = typeNode.key.name;
    const childMeta = get(`children.${name}`, meta[name])(meta);

    try {
      const type = parseType(
        typeNode.typeAnnotation.typeAnnotation,
        childMeta,
        !typeNode.optional,
        typeDeclarations
      );
      return Object.assign(accum, type ? { [name]: type } : {});
    } catch (error) {
      throw new Error(`Invalid type for prop '${name}': ${error.message}`);
    }
  }, {});
}

module.exports = parseTypes;
