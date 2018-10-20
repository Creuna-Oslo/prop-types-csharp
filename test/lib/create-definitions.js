const test = require('ava');

const createNewDefinitions = require('../../lib/transforms/create-definitions');

const template = (t, input, expected) => {
  const definitions = createNewDefinitions(input, 'Component');

  t.deepEqual(expected, definitions);
};

test(
  'Shape simple',
  template,
  { a: { type: 'shape', argument: { b: { type: 'string' } } } },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        argument: { a: { type: 'a', hasClassDefinition: true } }
      }
    },
    {
      name: 'a',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        argument: { b: { type: 'string' } }
      }
    }
  ]
);

test(
  'Shape nested',
  template,
  {
    a: {
      type: 'shape',
      argument: { b: { type: 'shape', argument: { c: { type: 'string' } } } }
    }
  },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        argument: { a: { type: 'a', hasClassDefinition: true } }
      }
    },
    {
      name: 'a',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        argument: { b: { type: 'b' } }
      }
    },
    {
      name: 'b',
      parent: { name: 'a', parent: { name: 'Component' } },
      properties: {
        type: 'shape',
        argument: { c: { type: 'string' } }
      }
    }
  ]
);

test(
  'Array simple',
  template,
  { a: { type: 'arrayOf', argument: { type: 'string' } } },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        argument: { a: { type: 'arrayOf', argument: { type: 'string' } } }
      }
    }
  ]
);

test(
  'Array nested',
  template,
  {
    a: {
      type: 'arrayOf',
      argument: {
        type: 'arrayOf',
        argument: { type: 'arrayOf', argument: { type: 'string' } }
      }
    }
  },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        argument: {
          a: {
            type: 'arrayOf',
            argument: {
              type: 'arrayOf',
              argument: { type: 'arrayOf', argument: { type: 'string' } }
            }
          }
        }
      }
    }
  ]
);

test(
  'Array of object',
  template,
  {
    a: {
      type: 'arrayOf',
      argument: { type: 'shape', argument: { b: { type: 'string' } } }
    }
  },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        argument: {
          a: {
            type: 'arrayOf',
            argument: {
              type: 'aItem',
              hasClassDefinition: true
            }
          }
        }
      }
    },
    {
      name: 'aItem',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        argument: { b: { type: 'string' } }
      }
    }
  ]
);

test(
  'Shape isRequired',
  template,
  {
    a: {
      type: 'shape',
      isRequired: true,
      argument: { b: { type: 'string' } }
    }
  },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        argument: {
          a: { type: 'a', hasClassDefinition: true, isRequired: true }
        }
      }
    },
    {
      name: 'a',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isRequired: true,
        argument: { b: { type: 'string' } }
      }
    }
  ]
);

test(
  'Array of shape isRequired',
  template,
  {
    a: {
      type: 'arrayOf',
      isRequired: true,
      argument: {
        type: 'shape',
        argument: { b: { type: 'string' } }
      }
    }
  },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        argument: {
          a: {
            type: 'arrayOf',
            isRequired: true,
            argument: {
              type: 'aItem',
              hasClassDefinition: true
            }
          }
        }
      }
    },
    {
      name: 'aItem',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        argument: {
          b: { type: 'string' }
        }
      }
    }
  ]
);

test(
  'Enum numbers',
  template,
  {
    a: { type: 'oneOf', argument: [1, 2, 3] }
  },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        argument: {
          a: { type: 'a', hasClassDefinition: true }
        }
      }
    },
    {
      name: 'a',
      parent: { name: 'Component' },
      properties: {
        type: 'oneOf',
        argument: [1, 2, 3]
      }
    }
  ]
);

test(
  'Enum strings',
  template,
  {
    a: { type: 'oneOf', argument: ['value-1', 'value-2'] }
  },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        argument: {
          a: { type: 'a', hasClassDefinition: true }
        }
      }
    },
    {
      name: 'a',
      parent: { name: 'Component' },
      properties: {
        type: 'oneOf',
        argument: ['value-1', 'value-2']
      }
    }
  ]
);
