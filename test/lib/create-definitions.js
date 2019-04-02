const test = require('ava');

const createNewDefinitions = require('../../lib/create-definitions');

const template = (t, input, expected) => {
  const definitions = createNewDefinitions('Component')(input);

  t.deepEqual(expected, definitions);
};

test('Empty object', template, {}, [
  {
    name: 'Component',
    properties: { type: 'shape', children: {} }
  }
]);

test(
  'Shape simple',
  template,
  { a: { type: 'shape', children: { b: { type: 'string' } } } },
  [
    {
      name: 'Component',
      properties: {
        type: 'shape',
        children: { a: { type: 'a', parents: ['Component'] } }
      }
    },
    {
      name: 'a',
      properties: {
        type: 'shape',
        parents: ['Component'],
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
      properties: {
        type: 'shape',
        children: { a: { type: 'a', parents: ['Component'] } }
      }
    },
    {
      name: 'a',
      properties: {
        type: 'shape',
        parents: ['Component'],
        children: {
          b: { type: 'b', parents: ['Component', 'a'] }
        }
      }
    },
    {
      name: 'b',
      properties: {
        type: 'shape',
        parents: ['Component', 'a'],
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
      properties: {
        type: 'shape',
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
      properties: {
        type: 'shape',
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
      properties: {
        type: 'shape',
        children: {
          a: {
            type: 'arrayOf',
            children: {
              type: 'aItem',
              parents: ['Component']
            }
          }
        }
      }
    },
    {
      name: 'aItem',
      properties: {
        type: 'shape',
        parents: ['Component'],
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
      properties: {
        type: 'shape',
        children: {
          a: {
            type: 'arrayOf',
            children: {
              type: 'aItem',
              parents: ['Component']
            }
          }
        }
      }
    },
    {
      name: 'aItem',
      properties: {
        type: 'shape',
        parents: ['Component'],
        children: {
          b: { type: 'b', parents: ['Component', 'aItem'] },
          d: { type: 'd', parents: ['Component', 'aItem'] }
        }
      }
    },
    {
      name: 'b',
      properties: {
        type: 'shape',
        parents: ['Component', 'aItem'],
        children: { c: { type: 'string' } }
      }
    },
    {
      name: 'd',
      properties: {
        type: 'oneOf',
        parents: ['Component', 'aItem'],
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
      properties: {
        type: 'shape',
        children: {
          a: { type: 'a', parents: ['Component'], isRequired: true }
        }
      }
    },
    {
      name: 'a',
      properties: {
        type: 'shape',
        isRequired: true,
        parents: ['Component'],
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
      properties: {
        type: 'shape',
        children: {
          a: {
            type: 'arrayOf',
            isRequired: true,
            children: {
              type: 'aItem',
              parents: ['Component']
            }
          }
        }
      }
    },
    {
      name: 'aItem',
      properties: {
        type: 'shape',
        parents: ['Component'],
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
      properties: {
        type: 'shape',
        children: {
          a: { type: 'a', parents: ['Component'] }
        }
      }
    },
    {
      name: 'a',
      properties: {
        type: 'oneOf',
        parents: ['Component'],
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
      properties: {
        type: 'shape',
        children: {
          a: { type: 'a', parents: ['Component'] }
        }
      }
    },
    {
      name: 'a',
      properties: {
        type: 'oneOf',
        parents: ['Component'],
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
      properties: {
        type: 'shape',
        children: {
          a: {
            type: 'arrayOf',
            children: { type: 'aItem', parents: ['Component'] }
          }
        }
      }
    },
    {
      name: 'aItem',
      properties: {
        type: 'oneOf',
        parents: ['Component'],
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
      properties: {
        type: 'shape',
        children: { type: { type: 'type' } }
      }
    }
  ]
);
