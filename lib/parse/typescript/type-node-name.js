const { get, match, otherwise } = require('kompis');
const t = require('@babel/types');

module.exports = match(
  [t.isTSAnyKeyword, () => 'any'],
  [t.isTSIntersectionType, () => 'intersection type'],
  [t.isTSLiteralType, () => 'literal type'],
  [t.isTSNeverKeyword, () => 'never'],
  [t.isTSObjectKeyword, () => 'object'],
  [t.isTSUnionType, () => 'union type'],
  [t.isTSVoidKeyword, () => 'void'],
  [otherwise, get('type')]
);
