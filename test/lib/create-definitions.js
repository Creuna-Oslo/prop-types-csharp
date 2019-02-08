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
    properties: { type: 'shape', children: {}, isComponentClass: true }
  }
]);

test(
  'Shape simple',
  template,
  { a: { type: 'shape', children: { b: { type: 'string' } } } },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        children: { a: { type: 'a', hasClassDefinition: true } }
      }
    },
    {
      name: 'a',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        children: { b: { type: 'string' } }
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
      children: { b: { type: 'shape', children: { c: { type: 'string' } } } }
    }
  },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        children: { a: { type: 'a', hasClassDefinition: true } }
      }
    },
    {
      name: 'a',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        children: { b: { type: 'b', hasClassDefinition: true } }
      }
    },
    {
      name: 'b',
      parent: { name: 'a', parent: { name: 'Component' } },
      properties: {
        type: 'shape',
        children: { c: { type: 'string' } }
      }
    }
  ]
);

test(
  'Array simple',
  template,
  { a: { type: 'arrayOf', children: { type: 'string' } } },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        children: { a: { type: 'arrayOf', children: { type: 'string' } } }
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
      children: {
        type: 'arrayOf',
        children: { type: 'arrayOf', children: { type: 'string' } }
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
        children: {
          a: {
            type: 'arrayOf',
            children: {
              type: 'arrayOf',
              children: { type: 'arrayOf', children: { type: 'string' } }
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
      children: { type: 'shape', children: { b: { type: 'string' } } }
    }
  },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        children: {
          a: {
            type: 'arrayOf',
            children: {
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
        children: { b: { type: 'string' } }
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
      children: {
        type: 'shape',
        children: {
          b: { type: 'shape', children: { c: { type: 'string' } } },
          d: { type: 'oneOf', children: ['a', 'b'] }
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
        children: {
          a: {
            type: 'arrayOf',
            children: {
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
        children: {
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
        children: { c: { type: 'string' } }
      }
    },
    {
      name: 'd',
      parent: { name: 'aItem', parent: { name: 'Component' } },
      properties: {
        type: 'oneOf',
        children: ['a', 'b']
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
      children: { b: { type: 'string' } }
    }
  },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        children: {
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
        children: { b: { type: 'string' } }
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
      children: {
        type: 'shape',
        children: { b: { type: 'string' } }
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
        children: {
          a: {
            type: 'arrayOf',
            isRequired: true,
            children: {
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
        children: {
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
    a: { type: 'oneOf', children: [1, 2, 3] }
  },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        children: {
          a: { type: 'a', hasClassDefinition: true }
        }
      }
    },
    {
      name: 'a',
      parent: { name: 'Component' },
      properties: {
        type: 'oneOf',
        children: [1, 2, 3]
      }
    }
  ]
);

test(
  'Enum strings',
  template,
  {
    a: { type: 'oneOf', children: ['value-1', 'value-2'] }
  },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        children: {
          a: { type: 'a', hasClassDefinition: true }
        }
      }
    },
    {
      name: 'a',
      parent: { name: 'Component' },
      properties: {
        type: 'oneOf',
        children: ['value-1', 'value-2']
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
      children: { type: 'oneOf', children: [1, 2] }
    }
  },
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        children: {
          a: {
            type: 'arrayOf',
            children: { type: 'aItem', hasClassDefinition: true }
          }
        }
      }
    },
    {
      name: 'aItem',
      parent: { name: 'Component' },
      properties: {
        type: 'oneOf',
        children: [1, 2]
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
        children: { type: { type: 'type' } }
      }
    }
  ]
);
