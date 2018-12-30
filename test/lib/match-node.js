const test = require('ava');
const bt = require('@babel/types');

const matchNode = require('../../lib/utils/match-node');

test('Finds Identifier', t => {
  const node = bt.identifier('hello');
  const value = matchNode(node, {
    Identifier: node => node.name
  });

  t.is('hello', value);
});

test('Returns value from no-match callback when no match was found', t => {
  const node = bt.identifier('hello');
  const value = matchNode(
    node,
    {
      MemberExpression: node => node.object.name
    },
    () => 'fail'
  );

  t.is('fail', value);
});

test('Runs undefined when no no-match callback is provided', t => {
  const node = bt.identifier('hello');
  const value = matchNode(node, {
    MemberExpression: node => node.object.name
  });

  t.is(undefined, value);
});
