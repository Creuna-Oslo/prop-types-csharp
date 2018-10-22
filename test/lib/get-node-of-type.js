const test = require('ava');
const bt = require('@babel/types');

const getNodeOfType = require('../../lib/utils/get-node-of-type');

test('Finds Identifier', t => {
  const node = bt.identifier('hello');
  const value = getNodeOfType(node, {
    Identifier: node => node.name
  });

  t.is('hello', value);
});

test('Returns value from no-match callback when no match was found', t => {
  const node = bt.identifier('hello');
  const value = getNodeOfType(
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
  const value = getNodeOfType(node, {
    MemberExpression: node => node.object.name
  });

  t.is(undefined, value);
});
