const test = require('ava');

const transformPropTypes = require('../../lib/transform-prop-types');

const template = (t, input, propTypesMeta = {}, expected) => {
  t.deepEqual(expected, transformPropTypes(propTypesMeta)(input));
};

test(
  "Converts 'exact' to 'shape'",
  template,
  {
    a: { type: 'exact', children: {} }
  },
  {},
  { a: { type: 'shape', children: {} } }
);

test(
  "Converts 'exact' to 'shape' in 'arrayOf'",
  template,
  {
    a: { type: 'arrayOf', children: { type: 'exact', children: {} } }
  },
  {},
  { a: { type: 'arrayOf', children: { type: 'shape', children: {} } } }
);

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
  'Removes client-only props in arrayOf',
  template,
  {
    a: { type: 'arrayOf', children: { type: 'node' } },
    b: { type: 'arrayOf', children: { type: 'func' } }
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
  { a: { type: 'shape', children: { b: { type: 'object' } } } },
  { a: { type: 'shape', children: { b: { type: 'exclude' } } } },
  { a: { type: 'shape', children: {} } }
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
    b: { type: 'shape', children: { c: { type: 'number' } } }
  },
  {},
  {
    a: { type: 'int' },
    b: { type: 'shape', children: { c: { type: 'int' } } }
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
  { a: { type: 'shape', children: { b: { type: 'object' } } } },
  { a: { type: 'shape', children: { b: { type: 'Link' } } } },
  { a: { type: 'shape', children: { b: { type: 'Link' } } } }
);

test(
  'Array meta',
  template,
  { a: { type: 'array' } },
  { a: { type: 'arrayOf', children: { type: 'Link' } } },
  { a: { type: 'arrayOf', children: { type: 'Link' } } }
);

test(
  'Meta is merged with propType',
  template,
  {
    a: {
      type: 'arrayOf',
      children: {
        type: 'shape',
        children: { b: { type: 'number' }, c: { type: 'string' } }
      }
    }
  },
  {
    a: {
      type: 'arrayOf',
      children: {
        type: 'shape',
        children: { b: { type: 'float' } }
      }
    }
  },
  {
    a: {
      type: 'arrayOf',
      children: {
        type: 'shape',
        children: { b: { type: 'float' }, c: { type: 'string' } }
      }
    }
  }
);

const throwsTemplate = (t, input, errorMessage) => {
  const error = t.throws(() => {
    transformPropTypes({})(input);
  });
  t.is(errorMessage, error.message);
};

test(
  'Throws on array',
  throwsTemplate,
  { a: { type: 'array' } },
  `Invalid type for prop 'a' ('array').
Replace with 'PropTypes.arrayOf' or provide a meta type`
);

test(
  'Throws on object',
  throwsTemplate,
  { a: { type: 'object' } },
  `Invalid type for prop 'a' ('object').
Replace with 'PropTypes.shape' or provide a meta type`
);

test(
  'Throws on oneOfType',
  throwsTemplate,
  { a: { type: 'oneOfType' } },
  `Invalid type for prop 'a' ('oneOfType').
'PropTypes.oneOfType' is not yet supported`
);

// Also test legal types to avoid false positive
const legalTypes = ['string', 'int', 'float'];

legalTypes.forEach(type => {
  test(`Throws on '${type}'`, t => {
    const propTypes = { a: { type } };
    t.notThrows(() => {
      transformPropTypes({})(propTypes);
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
