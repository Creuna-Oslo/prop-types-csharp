const t = require('@babel/types');

const getDefinitionName = require('./get-definition-name');
const matchNode = require('../../utils/match-node');

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
    TSTypeReference: n => {
      const name = getDefinitionName(n.typeName);
      const types = typeDeclarations[name];

      if (name === 'JSX.Element') {
        return newNode('node');
      }

      if (types) {
        return types.some(type => t.isTSEnumMember(type))
          ? newNode('oneOf', types.map(n => n.initializer.value))
          : parseTypes(types, typeDeclarations);
      }

      throw new Error(`No definition found for type '${name}'.`);
    }
  };

  return matchNode(typeNode, typeHandlers, node => {
    throw new Error(`Type '${node.type}' is not supported.`);
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
