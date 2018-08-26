const bt = require('babel-types');
const { parse } = require('@babel/parser');
const test = require('ava');

const getMeta = require('../../lib/utils/get-meta');

const template = (t, input, expected) => {
  const syntaxTree = parse(input, { plugins: ['classProperties', 'jsx'] });
  t.deepEqual(getMeta({ syntaxTree }).propTypesMeta, expected);
};

const throwsTemplate = (t, input) => {
  const syntaxTree = parse(input, { sourceType: 'module' });
  t.throws(() => {
    getMeta({ syntaxTree });
  });
};

test('Functional component', template, 'C.propTypesMeta = { a: "exclude" };', {
  a: bt.identifier('exclude')
});

test(
  'Class component',
  template,
  'class C { static propTypesMeta = { a: "exclude" }; };',
  {
    a: bt.identifier('exclude')
  }
);

test('No meta', template, 'const C = () => <div />;', {});

const allowedStringTypes = ['exclude', 'float', 'int'];

allowedStringTypes.forEach(stringType => {
  test(
    `Extracts '${stringType}'`,
    template,
    `C.propTypesMeta = { a: "${stringType}" };`,
    { a: bt.identifier(stringType) }
  );
});

test(
  'Extracts component reference',
  template,
  'C.propTypesMeta = { a: SomeComponent };',
  { a: bt.identifier('SomeComponent') }
);

test('Transforms Array', t => {
  t.plan(3);

  const syntaxTree = parse('C.propTypesMeta = { a: Array(SomeComponent) };');
  const { propTypesMeta } = getMeta({ syntaxTree });

  t.is(true, bt.isArrayExpression(propTypesMeta.a));
  t.is(propTypesMeta.a.elements.length, 1);
  t.is(
    true,
    bt.isIdentifier(propTypesMeta.a.elements[0], { name: 'SomeComponent' })
  );
});

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
