const traverse = require('@babel/traverse').default;

const getDefinitionName = require('./get-definition-name');
const matchNode = require('../../utils/match-node');

module.exports = ({ componentName, syntaxTree }) => {
  let typeName;
  let types;
  const typeDeclarations = {};

  traverse(syntaxTree, {
    TSEnumDeclaration: path => {
      typeDeclarations[getDefinitionName(path.node.id)] = path.node.members;
    },
    TSInterfaceDeclaration: path => {
      typeDeclarations[getDefinitionName(path.node.id)] = path.node.body.body;
    },
    TSTypeAliasDeclaration: path => {
      typeDeclarations[getDefinitionName(path.node.id)] =
        path.node.typeAnnotation.members;
    },
    ClassDeclaration: path => {
      if (path.node.id.name !== componentName) return;

      const { superTypeParameters } = path.node;

      if (superTypeParameters && superTypeParameters.params) {
        const [propsType] = superTypeParameters.params;

        types = matchNode(propsType, {
          TSTypeReference: node => {
            typeName = node.typeName.name;
            return typeDeclarations[node.typeName.name];
          },
          TSTypeLiteral: node => node.members
        });
      }
    },
    ArrowFunctionExpression: path => {
      if (!path.parentPath.isVariableDeclarator()) return;
      if (path.parent.id.name !== componentName) return;

      const [argument] = path.node.params;

      if (argument && argument.typeAnnotation) {
        types = matchNode(argument.typeAnnotation.typeAnnotation, {
          TSTypeReference: node => {
            typeName = node.typeName.name;
            return typeDeclarations[node.typeName.name];
          },
          TSTypeLiteral: node => node.members
        });
      }
    }
  });

  return { typeDeclarations, typeName, types };
};
