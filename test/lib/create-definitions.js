const test = require('ava');

const createNewDefinitions = require('../../lib/create-definitions');

const template = (t, input, expected) => {
  const definitions = createNewDefinitions(input, 'Component');

  t.deepEqual(expected, definitions);
};

test('Empty object', template, {}, [
  {
    name: 'Component',
    parent: { name: 'Component' },
    properties: { type: 'shape', argument: {}, isComponentClass: true }
  }
]);

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
        argument: { b: { type: 'b', hasClassDefinition: true } }
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
  'Array of shape',
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
  'Array with nested shapes and oneOf',
  template,
  {
    a: {
      type: 'arrayOf',
      argument: {
        type: 'shape',
        argument: {
          b: { type: 'shape', argument: { c: { type: 'string' } } },
          d: { type: 'oneOf', argument: ['a', 'b'] }
        }
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
          b: { type: 'b', hasClassDefinition: true },
          d: { type: 'd', hasClassDefinition: true }
        }
      }
    },
    {
      name: 'b',
      parent: { name: 'aItem', parent: { name: 'Component' } },
      properties: {
        type: 'shape',
        argument: { c: { type: 'string' } }
      }
    },
    {
      name: 'd',
      parent: { name: 'aItem', parent: { name: 'Component' } },
      properties: {
        type: 'oneOf',
        argument: ['a', 'b']
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

test(
  'Array of enum',
  template,
  {
    a: {
      type: 'arrayOf',
      argument: { type: 'oneOf', argument: [1, 2] }
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
            argument: { type: 'aItem', hasClassDefinition: true }
          }
        }
      }
    },
    {
      name: 'aItem',
      parent: { name: 'Component' },
      properties: {
        type: 'oneOf',
        argument: [1, 2]
      }
    }
  ]
);

// To make sure no shenanigans happen when props are called 'type'
test(
  'Prop named "type"',
  template,
  {
    type: { type: 'type' }
  },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        argument: { type: { type: 'type' } }
      }
    }
  ]
);
