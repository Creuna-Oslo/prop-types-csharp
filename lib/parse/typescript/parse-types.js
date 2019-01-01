const t = require('@babel/types');

const getDefinitionName = require('./get-definition-name');
const matchNode = require('../../utils/match-node');
const typeNodeName = require('./type-node-name');

const parseType = (typeNode, isRequired, typeDeclarations) => {
  const newNode = (type, argument) => ({ type, isRequired, argument });

  const typeHandlers = {
    TSArrayType: n =>
      newNode('arrayOf', parseType(n.elementType, false, typeDeclarations)),
    TSBooleanKeyword: () => newNode('bool'),
    TSFunctionType: () => newNode('func'),
    TSNumberKeyword: () => newNode('number'),
    TSStringKeyword: () => newNode('string'),
    TSTypeLiteral: n =>
      newNode('shape', parseTypes(n.members, typeDeclarations)),
    TSParenthesizedType: n =>
      parseType(n.typeAnnotation, isRequired, typeDeclarations),
    TSTypeReference: n => {
      const name = getDefinitionName(n.typeName);
      const types = typeDeclarations[name];

      if (name === 'JSX.Element') {
        // NOTE: JSX.Element is supposedly the thing typescript has that is most similar to PropTypes.node
        return newNode('node');
      }

      // If type is defined in file
      if (types) {
        return types.some(type => t.isTSEnumMember(type))
          ? newNode('oneOf', types.map(n => n.initializer.value))
          : parseTypes(types, typeDeclarations);
      }

      // If type is imported
      return newNode(name);
    }
  };

  return matchNode(typeNode, typeHandlers, node => {
    throw new Error(`Type '${typeNodeName(node)}' is not supported.`);
  });
};

function parseTypes(types, typeDeclarations) {
  return types.reduce((accum, typeNode) => {
    const name = typeNode.key.name;

    try {
      return Object.assign(accum, {
        [name]: parseType(
          typeNode.typeAnnotation.typeAnnotation,
          !typeNode.optional,
          typeDeclarations
        )
      });
    } catch (error) {
      throw new Error(`Invalid type for prop '${name}': ${error.message}`);
    }
  }, {});
}

module.exports = parseTypes;
