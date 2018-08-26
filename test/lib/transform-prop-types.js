const generate = require('@babel/generator').default;
const { parse } = require('@babel/parser');
const bt = require('babel-types');
const test = require('ava');

const transformPropTypes = require('../../lib/transforms/transform-prop-types');

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
  'Removes excluded props with nesting',
  template,
  'C.propTypes={a:pt.shape({ b: pt.object })};',
  'C.propTypes={};',
  {
    a: bt.identifier('exclude')
  }
);

test(
  'Removes excluded prop with illegal function call',
  template,
  'C.propTypes={a: someFunc()};',
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

test(
  'Replaces "number" with "int" by default',
  template,
  'C.propTypes={a:pt.number};',
  'C.propTypes={a:int};'
);

test(
  'Replaces nested meta types',
  template,
  'C.propTypes={a:pt.object};',
  'C.propTypes={a:{b:string}};',
  {
    a: bt.objectExpression([
      bt.objectProperty(bt.identifier('b'), bt.identifier('string'))
    ])
  }
);

test(
  'Deep nesting',
  template,
  'C.propTypes={a:pt.arrayOf(pt.arrayOf(pt.arrayOf(pt.string)))};',
  'C.propTypes={a:[[[string]]]};'
);

const illegalTypes = ['array', 'object', 'oneOfType'];

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
  'C.propTypes={a:pt.arrayOf(pt.string),b:pt.shape({c:pt.string})};',
  'C.propTypes={a:[string],b:{c:string}};'
);

test(
  'Component reference',
  template,
  'C.propTypes={a:pt.arrayOf(pt.shape(Link.propTypes))};',
  'C.propTypes={a:[Link]};'
);

test(
  'Component with nesting',
  template,
  'C.propTypes={a:pt.arrayOf(pt.shape({ b: Link.propTypes }))};',
  'C.propTypes={a:[{b:Link}]};'
);
