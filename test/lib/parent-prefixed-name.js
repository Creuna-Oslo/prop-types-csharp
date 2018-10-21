const test = require('ava');

const parentPrefixedName = require('../../lib/stringify/parent-prefixed-name');

test('Prefixes name with parents', t => {
  const prefixedName = parentPrefixedName('C', {
    name: 'b',
    parent: { name: 'a', parent: { name: 'Component' } }
  });
  t.is('Component_A_B_C', prefixedName);
});
