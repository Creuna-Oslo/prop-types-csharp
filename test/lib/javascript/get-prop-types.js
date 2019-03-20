const bt = require('@babel/types');
const { parse } = require('@babel/parser');
const test = require('ava');

const getPropTypes = require('../../../lib/parse/javascript/get-prop-types');

test('Functional component', t => {
  const syntaxTree = parse('C.propTypes = { a: string };');
  const propTypes = getPropTypes({ componentName: 'C', syntaxTree });
  const [property] = propTypes.properties;

  t.true(bt.isIdentifier(property.key, { name: 'a' }));
  t.true(bt.isIdentifier(property.value, { name: 'string' }));
});

test('Class component', t => {
  const syntaxTree = parse('class C { static propTypes = { a: string }; }', {
    plugins: ['classProperties']
  });
  const propTypes = getPropTypes({ componentName: 'C', syntaxTree });
  const [property] = propTypes.properties;

  t.true(bt.isIdentifier(property.key, { name: 'a' }));
  t.true(bt.isIdentifier(property.value, { name: 'string' }));
});

const throwsTemplate = (t, input, errorMessage) => {
  const syntaxTree = parse(input, { plugins: ['jsx'] });

  const error = t.throws(() => {
    getPropTypes({ componentName: 'C', syntaxTree });
  });

  t.is(errorMessage, error.message);
};

test(
  'Throws on missing propTypes',
  throwsTemplate,
  'const C = () => <div />;',
  'PropTypes not found'
);

test(
  'Throws with wrong component name in propTypes definition',
  throwsTemplate,
  'const C = () => <div />; D.propTypes = { a: PropTypes.string };',
  'PropTypes not found'
);
