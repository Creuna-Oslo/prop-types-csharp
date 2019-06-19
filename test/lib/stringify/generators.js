const test = require('ava');

const { generators } = require('../../../index.js');

// The names of the generator functions are used to set file extension in the webpack plugin
test('All exposed generators have unique names', t => {
  const names = Object.values(generators).map(generator => generator.name);

  // All generators have names
  t.is(names.length, names.filter(n => n).length);

  // Names are unique
  t.is(names.length, new Set(names).size);
});
