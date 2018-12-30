const test = require('ava');

const transformPropTypes = require('../../lib/transform-prop-types');

const template = (t, input, propTypesMeta = {}, expected) => {
  t.deepEqual(expected, transformPropTypes(input, propTypesMeta));
};

test(
  "Converts 'exact' to 'shape'",
  template,
  {
    a: { type: 'exact', argument: {} }
  },
  {},
  { a: { type: 'shape', argument: {} } }
);

test(
  "Converts 'exact' to 'shape' in 'arrayOf'",
  template,
  {
    a: { type: 'arrayOf', argument: { type: 'exact', argument: {} } }
  },
  {},
  { a: { type: 'arrayOf', argument: { type: 'shape', argument: {} } } }
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
    a: { type: 'arrayOf', argument: { type: 'node' } },
    b: { type: 'arrayOf', argument: { type: 'func' } }
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

test(
  'Meta is merged with propType',
  template,
  {
    a: {
      type: 'arrayOf',
      argument: {
        type: 'shape',
        argument: { b: { type: 'number' }, c: { type: 'string' } }
      }
    }
  },
  {
    a: {
      type: 'arrayOf',
      argument: {
        type: 'shape',
        argument: { b: { type: 'float' } }
      }
    }
  },
  {
    a: {
      type: 'arrayOf',
      argument: {
        type: 'shape',
        argument: { b: { type: 'float' }, c: { type: 'string' } }
      }
    }
  }
);

const throwsTemplate = (t, input, errorMessage) => {
  const error = t.throws(() => {
    transformPropTypes(input, {});
  });
  t.is(errorMessage, error.message);
};

test(
  'Throws on array',
  throwsTemplate,
  { a: { type: 'array' } },
  `Invalid type 'array' for prop 'a'.
Replace with 'PropTypes.arrayOf' or provide a meta type`
);

test(
  'Throws on object',
  throwsTemplate,
  { a: { type: 'object' } },
  `Invalid type 'object' for prop 'a'.
Replace with 'PropTypes.shape' or provide a meta type`
);

test(
  'Throws on oneOfType',
  throwsTemplate,
  { a: { type: 'oneOfType' } },
  `Invalid type 'oneOfType' for prop 'a'.
'PropTypes.oneOfType' is not yet supported`
);

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
