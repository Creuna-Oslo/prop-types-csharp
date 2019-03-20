const { get } = require('kompis');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const isMemberExpression = require('../../utils/is-member-expression');

// Returns Babel node containing only propTypes
module.exports = function({ componentName, syntaxTree }) {
  const isComponentTypesIdentifier = isMemberExpression(
    componentName,
    'propTypes'
  );

  const assignmentExpressions = syntaxTree.program.body
    .map(get('expression'))
    .filter(t.isAssignmentExpression);

  // Functional component propTypes
  const typeLiteral = assignmentExpressions.reduce((accum, node) => {
    return isComponentTypesIdentifier(node.left) ? node.right : accum;
  }, null);

  const typeMutations = assignmentExpressions.reduce((accum, node) => {
    return isComponentTypesIdentifier(node.left.object)
      ? [...accum, [node.left.property, node.right]]
      : accum;
  }, []);

  if (typeLiteral) {
    const mutations = typeMutations.map(m => t.objectProperty(...m));
    const propTypesValue = !t.isObjectExpression(typeLiteral)
      ? typeLiteral
      : t.objectExpression(typeLiteral.properties.concat(mutations));

    return propTypesValue;
  }

  let propTypesAST;

  // Class component propTypes
  traverse(syntaxTree, {
    ClassProperty(path) {
      const key = path.get('key');

      if (key.isIdentifier({ name: 'propTypes' })) {
        propTypesAST = path.node.value;
        path.stop();
      }

      path.skip();
    }
  });

  if (propTypesAST) {
    return propTypesAST;
  }

  throw new Error('PropTypes not found');
};
