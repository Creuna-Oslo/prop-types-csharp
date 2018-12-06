const { parse } = require('@babel/parser');
const test = require('ava');

const getMeta = require('../../lib/utils/get-meta');
const metaTypes = require('../../lib/meta-types');

const template = (t, input, expected) => {
  const syntaxTree = parse(input, { plugins: ['classProperties', 'jsx'] });
  t.deepEqual(expected, getMeta({ syntaxTree }).propTypesMeta);
};

const throwsTemplate = (t, input, errorMessage) => {
  const syntaxTree = parse(input, { sourceType: 'module' });
  const error = t.throws(() => {
    getMeta({ syntaxTree });
  });

  t.is(errorMessage, error.message);
};

test(
  'Allowed string types',
  template,
  `C.propTypesMeta = {
    a: 'int',
    b: 'float',
    c: 'double',
    d: 'int?',
    e: 'float?',
    f: 'double?'
  };`,
  {
    a: { type: 'int' },
    b: { type: 'float' },
    c: { type: 'double' },
    d: { type: 'int?' },
    e: { type: 'float?' },
    f: { type: 'double?' }
  }
);

test(
  'String literal "exclude"',
  template,
  'C.propTypesMeta = "exclude"',
  'exclude'
);

test(
  'Throws on misspelled string literal',
  throwsTemplate,
  'C.propTypesMeta = "excd";',
  `Unsupported propTypesMeta value 'excd'. Expected 'exclude'.`
);

test('Functional component', template, 'C.propTypesMeta = { a: "exclude" };', {
  a: { type: 'exclude' }
});

test(
  'Class component',
  template,
  'class C { static propTypesMeta = { a: "exclude" }; };',
  {
    a: { type: 'exclude' }
  }
);

test('Nested', template, 'C.propTypesMeta = { a: { b: "exclude" } };', {
  a: { type: 'shape', argument: { b: { type: 'exclude' } } }
});

test('No meta', template, 'const C = () => <div />;', {});

Object.values(metaTypes.strings).forEach(stringType => {
  test(
    `Extracts '${stringType}'`,
    template,
    `C.propTypesMeta = { a: "${stringType}" };`,
    { a: { type: stringType } }
  );
});

test(
  'Extracts component reference',
  template,
  'C.propTypesMeta = { a: SomeComponent };',
  { a: { type: 'SomeComponent' } }
);

test(
  'Transforms Array',
  template,
  'C.propTypesMeta = { a: Array(SomeComponent) };',
  { a: { type: 'arrayOf', argument: { type: 'SomeComponent' } } }
);

test(
  'Array with object literal',
  template,
  'C.propTypesMeta = { a: Array({ b: "float" }) };',
  {
    a: {
      type: 'arrayOf',
      argument: { type: 'shape', argument: { b: { type: 'float' } } }
    }
  }
);

test(
  'Throws on misspelled string',
  throwsTemplate,
  'C.propTypesMeta = { a: "exclud" };',
  "Invalid meta type 'exclud' for 'a'. Expected one of [exclude,double,double?,float,float?,int,int?]"
);

test(
  'Throws on calls other than Array',
  throwsTemplate,
  'C.propTypesMeta = { a: Object.keys(obj) };',
  "Unsupported function call in meta type for 'a'"
);

test(
  'Throws on empty Array',
  throwsTemplate,
  'C.propTypesMeta = { a: Array() };',
  "Missing value in 'Array' in meta type for 'a'"
);

test(
  'Throws when argument to Array is not an Identifier',
  throwsTemplate,
  'C.propTypesMeta = { a: Array(Component.propTypes) };',
  "Unsupported value in Array() in meta type for 'a'"
);

const unsupportedTypes = ['null', 'false', 'true', '[]'];

test('Throws on unsupported meta types', t => {
  unsupportedTypes.forEach(type => {
    const syntaxTree = parse(`C.propTypesMeta = { a: ${type} };`);
    const error = t.throws(() => {
      getMeta({ syntaxTree });
    });

    t.is("Unsupported meta type for 'a'", error.message);
  });
});
