const test = require('ava');

const stringify = require('../../../lib/stringify/typescript');
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
export interface Component {
  text: string,
  numbers?: [[[number]]],
  singleObject?: {
    propertyA: {
      propertyB?: string
    }
  },
  objects: [{
    propertyB?: string
  }]
}`;

const template = (
  t,
  input,
  expected,
  options,
  className = 'Component',
  removeIndentation
) => {
  t.is(
    normalize(expected, removeIndentation),
    normalize(stringify(input, className, options), removeIndentation)
  );
};

test('Basic propTypes', template, basicDefinition, basicClass);

test(
  'objectOf',
  template,
  {
    a: { type: 'objectOf', children: { type: 'string' } },
    b: { type: 'objectOf', children: { type: 'Link' } },
    c: {
      type: 'objectOf',
      children: { type: 'shape', children: { d: { type: 'string' } } }
    }
  },
  `
  import { Link } from "./Link";

  export interface Component { 
    a?: {
      [key: string]: string
    },
    b?: {
      [key: string]: Link
    },
    c?: {
      [key: string]: {
        d?: string
      }
    }
  }`
);

test(
  'Enum',
  template,
  {
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
  },
  `export interface Component { 
    a?: "value-1" | "-value-2" | ".value-3" | "#value-4",
    b?: "A" | "B" | "C" | "D"
  }`
);

test(
  'Namespace',
  template,
  { a: { type: 'string' } },
  `namespace ViewModels {
    export interface Component { 
      a?: string
    }
  }`,
  { namespace: 'ViewModels' }
);

test(
  'Extending other component',
  template,
  'OtherComponent',
  `export interface Component extends OtherComponent {};`
);

test(
  'With baseClass and namespace',
  template,
  { a: { type: 'Link' } },
  `import { BaseClass } from "./BaseClass";
  import { Link } from "./Link";

  namespace ViewModels {
    export interface Component extends BaseClass { 
      a?: Link
    }
  }`,
  {
    baseClass: 'BaseClass',
    namespace: 'ViewModels'
  }
);
