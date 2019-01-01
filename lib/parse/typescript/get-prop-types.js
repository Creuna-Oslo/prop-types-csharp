const get = require('lodash/get');
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

      const propsType = get(path.node, 'superTypeParameters.params[0]');

      types = matchNode(propsType, {
        TSTypeReference: node => {
          typeName = node.typeName.name;
          return typeDeclarations[node.typeName.name];
        },
        TSTypeLiteral: node => node.members
      });
    },
    ArrowFunctionExpression: path => {
      if (!path.parentPath.isVariableDeclarator()) return;
      if (path.parent.id.name !== componentName) return;

      const argType = get(path, 'node.params[0].typeAnnotation.typeAnnotation');

      if (argType) {
        types = matchNode(argType, {
          TSTypeReference: node => {
            typeName = node.typeName.name;
            return typeDeclarations[node.typeName.name];
          },
          TSTypeLiteral: node => node.members
        });
        return;
      }

      const parentTypeParam = get(
        path,
        'parent.id.typeAnnotation.typeAnnotation.typeParameters.params[0]'
      );
      if (parentTypeParam) {
        types = matchNode(parentTypeParam, {
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
