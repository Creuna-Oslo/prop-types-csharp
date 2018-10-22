const test = require('ava');

const transformPropTypes = require('../../lib/transforms/transform-prop-types');

const template = (t, input, propTypesMeta = {}, expected) => {
  t.deepEqual(expected, transformPropTypes(input, propTypesMeta));
};

test(
  'Removes client-only props',
  template,
  {
    a: { type: 'element' },
    b: { type: 'func' },
    c: { type: 'instanceOf' },
    d: { type: 'node' }
  },
  {},
  {}
);

test(
  'Removes excluded props',
  template,
  { a: { type: 'array' } },
  { a: { type: 'exclude' } },
  {}
);

test(
  'Removes excluded props with nesting',
  template,
  { a: { type: 'shape', argument: { b: { type: 'object' } } } },
  { a: { type: 'shape', argument: { b: { type: 'exclude' } } } },
  { a: { type: 'shape', argument: {} } }
);

test(
  'Applies meta types',
  template,
  { a: { type: 'number' }, b: { type: 'number' } },
  { a: { type: 'int' }, b: { type: 'float' } },
  { a: { type: 'int' }, b: { type: 'float' } }
);

test(
  'Replaces "number" with "int" by default',
  template,
  {
    a: { type: 'number' },
    b: { type: 'shape', argument: { c: { type: 'number' } } }
  },
  {},
  {
    a: { type: 'int' },
    b: { type: 'shape', argument: { c: { type: 'int' } } }
  }
);

test(
  'Replaces "number" with "int" by default with isRequired',
  template,
  { a: { type: 'number', isRequired: true } },
  {},
  { a: { type: 'int', isRequired: true } }
);

test(
  'Replaces nested meta types',
  template,
  { a: { type: 'shape', argument: { b: { type: 'object' } } } },
  { a: { type: 'shape', argument: { b: { type: 'Link' } } } },
  { a: { type: 'shape', argument: { b: { type: 'Link' } } } }
);

test(
  'Array meta',
  template,
  { a: { type: 'array' } },
  { a: { type: 'arrayOf', argument: { type: 'Link' } } },
  { a: { type: 'arrayOf', argument: { type: 'Link' } } }
);

const illegalTypes = ['array', 'object', 'oneOfType'];

illegalTypes.forEach(type => {
  test(`Throws on '${type}'`, t => {
    const propTypes = { a: { type } };
    t.throws(() => {
      transformPropTypes(propTypes, {});
    });
  });
});

// Also test legal types to avoid false positive
const legalTypes = ['string', 'int', 'float'];

legalTypes.forEach(type => {
  test(`Throws on '${type}'`, t => {
    const propTypes = { a: { type } };
    t.notThrows(() => {
      transformPropTypes(propTypes, {});
    });
  });
});

// To make sure no shenanigans happen when props are called 'type'
test(
  'Prop named "type"',
  template,
  { type: { type: 'string' } },
  {},
  { type: { type: 'string' } }
);
