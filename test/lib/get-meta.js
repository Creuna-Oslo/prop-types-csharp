const bt = require('@babel/types');
const { parse } = require('@babel/parser');
const test = require('ava');

const getMeta = require('../../lib/utils/get-meta');
const metaTypes = require('../../lib/meta-types');

const template = (t, input, expected) => {
  const syntaxTree = parse(input, { plugins: ['classProperties', 'jsx'] });
  t.deepEqual(expected, getMeta({ syntaxTree }).propTypesMeta);
};

const throwsTemplate = (t, input) => {
  const syntaxTree = parse(input, { sourceType: 'module' });
  t.throws(() => {
    getMeta({ syntaxTree });
  });
};

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
  'Throws on misspelled string',
  throwsTemplate,
  'C.propTypesMeta = { a: "exclud" };'
);

test(
  'Throws on calls other than Array',
  throwsTemplate,
  'C.propTypesMeta = { a: Object.keys(obj) };'
);

const unsupportedTypes = ['null', 'false', 'true', '[]'];

test('Throws on unsupported meta types', t => {
  t.plan(unsupportedTypes.length);

  unsupportedTypes.forEach(type => {
    const syntaxTree = parse(`C.propTypesMeta = { a: ${type} };`);
    t.throws(() => {
      getMeta({ syntaxTree });
    });
  });
});
