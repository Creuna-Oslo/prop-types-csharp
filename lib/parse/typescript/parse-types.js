const { get } = require('kompis');
const t = require('@babel/types');

const getDefinitionName = require('./get-definition-name');
const matchNode = require('../../utils/match-node');
const typeNodeName = require('./type-node-name');
const { throwError } = require('../../utils/error-handling');

// NOTE: JSX.Element is supposedly the thing typescript has that is most similar to PropTypes.node
const typesToStrip = ['JSX.Element'];

const handleTypeReference = (typeDeclarations, newNode) => n => {
  const name = getDefinitionName(n.typeName);
  const types = typeDeclarations[name];

  if (typesToStrip.includes(name)) return;

  return !types
    ? newNode('ref', undefined, name) // When type isn't defined in file
    : types.some(t.isTSEnumMember)
    ? newNode('oneOf', types.map(get('initializer.value')))
    : parseTypes(types, typeDeclarations);
};

const parseType = (typeNode, isRequired, typeDeclarations) => {
  const newNode = (type, children, ref) => ({
    type,
    isRequired,
    children,
    ref
  });

  return matchNode(
    typeNode,
    {
      TSArrayType: n =>
        newNode('arrayOf', parseType(n.elementType, false, typeDeclarations)),
      TSBooleanKeyword: () => newNode('bool'),
      TSFunctionType: () => undefined,
      TSNumberKeyword: () => newNode('number'),
      TSStringKeyword: () => newNode('string'),
      TSTypeLiteral: n =>
        newNode('shape', parseTypes(n.members, typeDeclarations)),
      TSParenthesizedType: n =>
        parseType(n.typeAnnotation, isRequired, typeDeclarations),
      TSTypeReference: handleTypeReference(typeDeclarations, newNode)
    },
    n => throwError(`Type '${typeNodeName(n)}' is not supported.`)
  );
};

function parseTypes(types, typeDeclarations) {
  return types.reduce((accum, typeNode) => {
    const name = typeNode.key.name;

    try {
      const type = parseType(
          typeNode.typeAnnotation.typeAnnotation,
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
