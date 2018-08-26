// Checks whether a node is an ArrayExpression. If it is, recursively checks whether the first element of the possibly nested array is an identifier.
// [someIdentifier], [[someIdentifier]] should return true.
// ["abc"], [[[3]]] should return false.
const isIdentifierArray = maybeArrayExpression => {
  switch (maybeArrayExpression.type) {
    case 'Identifier':
      return true;
    case 'ArrayExpression':
      return isIdentifierArray(maybeArrayExpression.elements[0]);
    default:
      return false;
  }
};

module.exports = isIdentifierArray;
