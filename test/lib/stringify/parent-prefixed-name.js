const test = require('ava');

const parentPrefixedName = require('../../../lib/stringify/parent-prefixed-name');

test('Prefixes name with parents', t => {
  const prefixedName = parentPrefixedName('C', ['Component', 'a', 'b']);
  t.is('Component_A_B_C', prefixedName);
});
