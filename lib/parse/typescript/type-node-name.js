const matchNode = require('../../utils/match-node');

module.exports = function(node) {
  return matchNode(
    node,
    {
      TSAnyKeyword: () => 'any',
      TSIntersectionType: () => 'intersection type',
      TSLiteralType: () => 'literal type',
      TSNeverKeyword: () => 'never',
      TSObjectKeyword: () => 'object',
      TSUnionType: () => 'union type',
      TSVoidKeyword: () => 'void'
    },
    () => node.type
  );
};
