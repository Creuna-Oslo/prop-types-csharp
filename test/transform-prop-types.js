const generate = require('@babel/generator').default;
const { parse } = require('@babel/parser');
const bt = require('babel-types');
const test = require('ava');

const transformPropTypes = require('../source/transforms/transform-prop-types');

const template = (t, input, expected, propTypesMeta = {}) => {
  const syntaxTree = parse(input);
  transformPropTypes({
    propTypesIdentifierName: 'pt',
    propTypesMeta,
    syntaxTree
  });

  t.is(generate(syntaxTree, { minified: true }).code, expected);
};

test(
  'Removes client-only props',
  template,
  'C.propTypes={a:pt.element,b:pt.func,c:pt.instanceOf,d:pt.node}',
  'C.propTypes={};'
);

test(
  'Removes excluded props',
  template,
  'C.propTypes={a:pt.array};',
  'C.propTypes={};',
  { a: bt.identifier('exclude') }
);

test(
  'Applies meta types',
  template,
  'C.propTypes={a:pt.number,b:pt.number};',
  'C.propTypes={a:int,b:float};',
  {
    a: bt.identifier('int'),
    b: bt.identifier('float')
  }
);

const illegalTypes = ['array', 'number', 'object', 'oneOfType'];

illegalTypes.forEach(type => {
  test(`Throws on '${type}'`, t => {
    const syntaxTree = parse(`C.propTypes={a:pt.${type}};`);
    t.throws(() => {
      transformPropTypes({
        propTypesIdentifierName: 'pt',
        propTypesMeta: {},
        syntaxTree
      });
    });
  });
});

test(
  'Removes propTypes "prefix"',
  template,
  'C.propTypes={a:pt.arrayOf(pt.string)};',
  'C.propTypes={a:arrayOf(string)};'
);
