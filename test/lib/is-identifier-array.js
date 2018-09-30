const bt = require('@babel/types');
const test = require('ava');

const isIdentifierArray = require('../../lib/utils/is-identifier-array');

test('Basic array', t => {
  t.is(true, isIdentifierArray(bt.arrayExpression([bt.identifier('a')])));
});

test('Not array', t => {
  t.is(false, isIdentifierArray(bt.stringLiteral('a')));
  t.is(
    false,
    isIdentifierArray(bt.objectProperty(bt.identifier('a'), bt.identifier('a')))
  );
});

test('Nested array', t => {
  t.is(
    true,
    isIdentifierArray(
      bt.arrayExpression([bt.arrayExpression([bt.identifier('a')])])
    )
  );
});

test('Nested array of literal', t => {
  t.is(
    false,
    isIdentifierArray(
      bt.arrayExpression([bt.arrayExpression([bt.stringLiteral('a')])])
    )
  );
});
