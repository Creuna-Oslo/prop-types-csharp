const test = require('ava');

const nestedArrayString = require('../../../lib/stringify/csharp/nested-array-string');

test('With external class', t => {
  const arrayString = nestedArrayString({
    type: 'arrayOf',
    children: { type: 'arrayOf', children: { type: 'Link' } }
  });

  t.is('IList<IList<Link>>', arrayString);
});

test('With reference to class defined in the current file', t => {
  const arrayString = nestedArrayString({
    type: 'arrayOf',
    children: {
      type: 'arrayOf',
      children: {
        type: 'someProp',
        parents: ['Component']
      }
    }
  });

  t.is('IList<IList<Component_SomeProp>>', arrayString);
});

test('Supports other list types', t => {
  const arrayString = nestedArrayString(
    {
      type: 'arrayOf',
      children: { type: 'arrayOf', children: { type: 'Link' } }
    },
    'List'
  );

  t.is('List<List<Link>>', arrayString);
});
