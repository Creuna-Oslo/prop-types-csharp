const { parse } = require('@babel/parser');
const test = require('ava');

const parseAST = require('../../lib/utils/parse-ast');

const template = (t, input, propTypeMeta, expected) => {
  const ast = parse(input);

  t.deepEqual(expected, parseAST(ast, propTypeMeta));
};

test(
  'Other component reference',
  template,
  'Component.propTypes = AnotherComponent.propTypes',
  {},
  'AnotherComponent'
);

test(
  'Basic types',
  template,
  `
Component.propTypes = {
  a: string.isRequired,
  b: number,
  c: bool
}`,
  {},
  {
    a: { type: 'string', isRequired: true },
    b: { type: 'number' },
    c: { type: 'bool' }
  }
);

test(
  'oneOf numbers',
  template,
  `Component.propTypes = { a: oneOf([1,2]) }`,
  {},
  { a: { type: 'oneOf', argument: [1, 2] } }
);

test(
  'oneOf strings',
  template,
  `Component.propTypes = { a: oneOf(['a','b']) }`,
  {},
  { a: { type: 'oneOf', argument: ['a', 'b'] } }
);

test(
  'oneOf required',
  template,
  `Component.propTypes = { a: oneOf([1]).isRequired }`,
  {},
  { a: { type: 'oneOf', argument: [1], isRequired: true } }
);

test(
  'shape',
  template,
  `Component.propTypes = { a: shape({ b: shape({ c: string })}) }`,
  {},
  {
    a: {
      type: 'shape',
      argument: { b: { type: 'shape', argument: { c: { type: 'string' } } } }
    }
  }
);

test(
  'shape with component reference',
  template,
  `Component.propTypes = { a: shape(OtherComponent.propTypes) }`,
  {},
  {
    a: {
      type: 'OtherComponent'
    }
  }
);

test(
  'arrayOf string',
  template,
  `Component.propTypes = { a: arrayOf(string) }`,
  {},
  {
    a: {
      type: 'arrayOf',
      argument: { type: 'string' }
    }
  }
);

test(
  'arrayOf shape',
  template,
  `Component.propTypes = { a: arrayOf(shape({ b: string })) }`,
  {},
  {
    a: {
      type: 'arrayOf',
      argument: { type: 'shape', argument: { b: { type: 'string' } } }
    }
  }
);

test('Invalid function call', t => {
  const ast = parse(`Component.propTypes = { a: someFunc() };`);
  t.throws(() => {
    parseAST(ast);
  });
});

test('Invalid function call with exclude', t => {
  const ast = parse(`Component.propTypes = { a: someFunc() };`);
  const meta = { a: { type: 'exclude' } };

  t.notThrows(() => {
    parseAST(ast, meta);
  });
});

test('Allowed function calls', t => {
  const ast = parse(`Component.propTypes = {
    a: arrayOf(),
    b: oneOf(),
    c: shape(),
    d: instanceOf()
};`);

  t.notThrows(() => {
    parseAST(ast);
  });
});
