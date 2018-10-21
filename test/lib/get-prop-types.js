const bt = require('@babel/types');
const { parse } = require('@babel/parser');
const test = require('ava');

const getPropTypes = require('../../lib/utils/get-prop-types');

test('Functional component', t => {
  t.plan(3);

  const syntaxTree = parse('C.propTypes = { a: string };');
  const { propTypesAST } = getPropTypes({ componentName: 'C', syntaxTree });
  const { left, right } = propTypesAST.expression;
  const [property] = right.properties;

  t.true(bt.isIdentifier(left, { name: 'C' }));
  t.true(bt.isIdentifier(property.key, { name: 'a' }));
  t.true(bt.isIdentifier(property.value, { name: 'string' }));
});

test('Class component', t => {
  t.plan(3);

  const syntaxTree = parse('class C { static propTypes = { a: string }; }', {
    plugins: ['classProperties']
  });
  const { propTypesAST } = getPropTypes({ componentName: 'C', syntaxTree });
  const { left, right } = propTypesAST.expression;
  const [property] = right.properties;

  t.true(bt.isIdentifier(left, { name: 'C' }));
  t.true(bt.isIdentifier(property.key, { name: 'a' }));
  t.true(bt.isIdentifier(property.value, { name: 'string' }));
});

// TODO: also check error messages
test('Throws on missing propTypes', t => {
  const syntaxTree = parse('const C = () => <div />;', { plugins: ['jsx'] });

  t.throws(() => {
    getPropTypes({ componentName: 'C', syntaxTree });
  });
});

test('Throws with wrong component name in propTypes definition', t => {
  const syntaxTree = parse(
    'const C = () => <div />; D.propTypes = { a: PropTypes.string };',
    { plugins: ['jsx'] }
  );

  t.throws(() => {
    getPropTypes({ componentName: 'C', syntaxTree });
  });
});
