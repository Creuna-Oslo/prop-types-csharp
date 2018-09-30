const generate = require('@babel/generator').default;
const { parse } = require('@babel/parser');
const bt = require('@babel/types');
const test = require('ava');

const transformPropTypes = require('../../lib/transforms/transform-prop-types');

const template = (t, input, expected, propTypesMeta = {}) => {
  const syntaxTree = parse(input);
  transformPropTypes({
    propTypesIdentifierName: 'pt',
    propTypesMeta,
    syntaxTree
  });

  t.is(expected, generate(syntaxTree, { minified: true }).code);
};

test(
  'Removes client-only props',
  template,
  'C.propTypes={a:element,b:func,c:instanceOf,d:node}',
  'C={};'
);

test('Removes excluded props', template, 'C.propTypes={a:array};', 'C={};', {
  a: bt.identifier('exclude')
});

test(
  'Removes excluded props with nesting',
  template,
  'C.propTypes={a:shape({ b: object })};',
  'C={};',
  {
    a: bt.identifier('exclude')
  }
);

test(
  'Removes excluded prop with illegal function call',
  template,
  'C.propTypes={a: someFunc()};',
  'C={};',
  { a: bt.identifier('exclude') }
);

test(
  'Applies meta types',
  template,
  'C.propTypes={a:number,b:number};',
  'C={a:int,b:float};',
  {
    a: bt.identifier('int'),
    b: bt.identifier('float')
  }
);

test(
  'Replaces "number" with "int" by default',
  template,
  'C.propTypes={a:number};',
  'C={a:int};'
);

test(
  'Replaces "number" with "int" by default with isRequired',
  template,
  'C.propTypes={a:{b:number.isRequired}};',
  'C={a:{b:int.isRequired}};'
);

test(
  'Replaces nested meta types',
  template,
  'C.propTypes={a:shape({b:object})};',
  'C={a:{b:Link}};',
  {
    a: {
      b: bt.identifier('Link')
    }
  }
);

test('Array meta', template, 'C.propTypes={a:array};', 'C={a:[Link]};', {
  a: bt.arrayExpression([bt.identifier('Link')])
});

test(
  'Removes excluded nested prop',
  template,
  'C.propTypes={a:shape({ b: object })};',
  'C={a:{}};',
  {
    a: {
      b: bt.identifier('exclude')
    }
  }
);

test(
  'Deep nesting',
  template,
  'C.propTypes={a:arrayOf(arrayOf(arrayOf(string)))};',
  'C={a:[[[string]]]};'
);

const illegalTypes = ['array', 'object', 'oneOfType'];

illegalTypes.forEach(type => {
  test(`Throws on '${type}'`, t => {
    const syntaxTree = parse(`C.propTypes={a:${type}};`);
    t.throws(() => {
      transformPropTypes({
        propTypesIdentifierName: 'pt',
        propTypesMeta: {},
        syntaxTree
      });
    });
  });
});

illegalTypes.forEach(type => {
  test(`Throws on '${type}' with isRequired`, t => {
    const syntaxTree = parse(`C.propTypes={a:${type}.isRequired};`);
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
  'C.propTypes={a:arrayOf(string),b:shape({c:string})};',
  'C={a:[string],b:{c:string}};'
);

test(
  'Component reference',
  template,
  'C.propTypes={a:arrayOf(shape(Link.propTypes))};',
  'C={a:[Link]};'
);

// Doing this will result in PropTypes-validation failing, but we can generate a class anyway
test(
  'Component reference without shape',
  template,
  'C.propTypes={a:arrayOf(Link.propTypes)};',
  'C={a:[Link]};'
);

test(
  'Component with nesting',
  template,
  'C.propTypes={a:arrayOf(shape({ b: Link.propTypes }))};',
  'C={a:[{b:Link}]};'
);
