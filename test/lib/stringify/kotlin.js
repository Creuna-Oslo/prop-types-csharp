const test = require('ava');

const stringify = require('../../../lib/stringify/kotlin');
const normalize = require('../../utils/_normalize-string');

const basicDefinition = {
  text: { type: 'string', isRequired: true },
  numbers: {
    type: 'arrayOf',
    children: {
      type: 'arrayOf',
      children: { type: 'arrayOf', children: { type: 'int' } }
    }
  },
  singleObject: {
    type: 'shape',
    children: {
      propertyA: {
        type: 'shape',
        children: { propertyB: { type: 'string' } },
        isRequired: true
      }
    }
  },
  objects: {
    type: 'arrayOf',
    isRequired: true,
    children: {
      type: 'shape',
      children: { propertyB: { type: 'string' } }
    }
  }
};

const basicClass = `
package Component

data class Component(
  val text: String,
  val numbers: Array<Array<Array<Int>>>? = null,
  val singleObject: Component_SingleObject? = null,
  val objects: Array<Component_Objects>
)

data class Component_SingleObject(
  val propertyA: Component_SingleObject_PropertyA
)

data class Component_SingleObject_PropertyA(
  val propertyB: String? = null
)

data class Component_Objects(
  val propertyB: String? = null
)`;

test('Basic propTypes', t => {
  t.is(
    normalize(basicClass),
    normalize(stringify(basicDefinition, 'Component'))
  );
});

test('objectOf', t => {
  const propTypes = {
    a: { type: 'objectOf', children: { type: 'string' } },
    b: { type: 'objectOf', children: { type: 'Link' } },
    c: {
      type: 'objectOf',
      children: { type: 'shape', children: { d: { type: 'string' } } }
    }
  };
  const expected = `
package Component

import Link.*

data class Component(
  val a: Map<String, String>? = null,
  val b: Map<String, Link>? = null,
  val c: Map<String, Component_C>? = null
)
data class Component_C(
  val d: String? = null
)`;

  t.is(normalize(expected), normalize(stringify(propTypes, 'Component')));
});

test('Enum', t => {
  const propTypes = {
    a: {
      type: 'oneOf',
      children: ['value-1', '-value-2', '.value-3', '#value-4']
    },
    b: {
      type: 'oneOf',
      children: [
        { key: 'value-1', value: 'A' },
        { key: '-value-2', value: 'B' },
        { key: '.value-3', value: 'C' },
        { key: '#value-4', value: 'D' }
      ]
    }
  };
  const expected = `
package Component

data class Component(
  val a: Component_A? = null,
  val b: Component_B? = null
)

enum class Component_A(val stringValue: String) {
  value1("value-1"),
  value2("-value-2"),
  value3(".value-3"),
  value4("#value-4");

  override fun toString(): String {
    return stringValue;
  }
}

enum class Component_B(val stringValue: String) {
  value1("A"),
  value2("B"),
  value3("C"),
  value4("D");

  override fun toString(): String {
    return stringValue;
  }
}`;

  t.is(normalize(expected), normalize(stringify(propTypes, 'Component')));
});

test('Namespace', t => {
  const propTypes = { a: { type: 'string' } };
  const expected = `
package ViewModels.Component
data class Component(
  val a: String? = null
)`;
  t.is(
    normalize(expected),
    normalize(stringify(propTypes, 'Component', { namespace: 'ViewModels' }))
  );
});

test('Extending other component', t => {
  const expected = `
package Component
typealias Component = OtherComponent`;
  t.is(
    normalize(expected),
    normalize(stringify('OtherComponent', 'Component'))
  );
});
