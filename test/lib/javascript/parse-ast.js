const { parse } = require('@babel/parser');
const test = require('ava');

const parseAST = require('../../../lib/parse/javascript/parse-ast');

const template = (t, input, propTypeMeta, expected) => {
  const ast = parse(input);
  const propTypes = ast.program.body[0].expression;

  t.deepEqual(expected, parseAST(propTypes, propTypeMeta));
};

const throwsTemplate = (t, input, errorMessage) => {
  const ast = parse(input);
  const propTypes = ast.program.body[0].expression;

  const error = t.throws(() => {
    parseAST(propTypes);
  });

  t.is(errorMessage, error.message);
};

test(
  'Basic types',
  template,
  `({
    a: string.isRequired,
    b: number,
    c: bool
  })`,
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
  `({ a: oneOf([1,2]) })`,
  {},
  { a: { type: 'oneOf', children: [1, 2] } }
);

test(
  'oneOf strings',
  template,
  `({ a: oneOf(['a','b']) })`,
  {},
  { a: { type: 'oneOf', children: ['a', 'b'] } }
);

test(
  'oneOf Object.keys',
  template,
  `({ a: oneOf(Object.keys({a:'b',c:'d'})) })`,
  {},
  { a: { type: 'oneOf', children: ['a', 'c'] } }
);

test(
  'oneOf Object.values',
  template,
  `({ a: oneOf(Object.values({a:'b',c:'d'})) })`,
  {},
  {
    a: {
      type: 'oneOf',
      children: [{ key: 'a', value: 'b' }, { key: 'c', value: 'd' }]
    }
  }
);

test(
  'Throws on unsupported Object method',
  throwsTemplate,
  '({ prop:oneOf(Object.entries({a:"b"})) })',
  "Unsupported method 'Object.entries'."
);

test("Doesn't throw on Object method call without children", t => {
  const ast = parse(`({ a: oneOf(Object.values()) })`);

  t.notThrows(() => {
    parseAST(ast);
  });
});

test("Doesn't throw on object without entries", t => {
  const ast = parse(`({ a: oneOf(Object.values({})) })`);

  t.notThrows(() => {
    parseAST(ast);
  });
});

test(
  'Invalid oneOf value',
  throwsTemplate,
  `({ a: oneOf([true, false]) })`,
  'Unsupported BooleanLiteral in PropTypes.oneOf'
);

test(
  'oneOf required',
  template,
  `({ a: oneOf([1]).isRequired })`,
  {},
  { a: { type: 'oneOf', children: [1], isRequired: true } }
);

test(
  'oneOfType with exclude',
  template,
  `({ a: oneOfType([string, number]) })`,
  { a: { type: 'exclude' } },
  {}
);

test(
  'shape',
  template,
  `({ a: shape({ b: shape({ c: string })}) })`,
  {},
  {
    a: {
      type: 'shape',
      children: { b: { type: 'shape', children: { c: { type: 'string' } } } }
    }
  }
);

test(
  'exact',
  template,
  `({ a: exact({ b: exact({ c: string })}) })`,
  {},
  {
    a: {
      type: 'exact',
      children: { b: { type: 'exact', children: { c: { type: 'string' } } } }
    }
  }
);

test(
  'shape with component reference',
  template,
  `({ a: shape(OtherComponent.propTypes) })`,
  {},
  {
    a: {
      type: 'OtherComponent'
    }
  }
);

test(
  'Exact with component reference',
  template,
  `({ a: exact(OtherComponent.propTypes) })`,
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
  `({ a: arrayOf(string) })`,
  {},
  {
    a: {
      type: 'arrayOf',
      children: { type: 'string' }
    }
  }
);

test(
  'arrayOf shape',
  template,
  `({ a: arrayOf(shape({ b: string })) })`,
  {},
  {
    a: {
      type: 'arrayOf',
      children: { type: 'shape', children: { b: { type: 'string' } } }
    }
  }
);

test(
  'Invalid function call',
  throwsTemplate,
  '({ a: someFunc() })',
  "Invalid function call 'someFunc'"
);

test('Invalid function call with exclude', t => {
  const ast = parse(`({ a: someFunc() })`);
  const meta = { a: { type: 'exclude' } };

  t.notThrows(() => {
    parseAST(ast, meta);
  });
});

test('Invalid function call and object method with exclude', t => {
  const ast = parse(`({ a: someFunc(Object.entries({a:1})) })`);
  const meta = { a: { type: 'exclude' } };

  t.notThrows(() => {
    parseAST(ast, meta);
  });
});

test('Allowed function calls', t => {
  const ast = parse(`({
    a: arrayOf(),
    b: oneOf(),
    c: shape(),
    d: instanceOf()
  })`);

  t.notThrows(() => {
    parseAST(ast);
  });
});

// To make sure no shenanigans happen when props are called 'type'
test(
  'Prop named "type"',
  template,
  `({ type: (shape({ b: type })) })`,
  {},
  {
    type: { type: 'shape', children: { b: { type: 'type' } } }
  }
);
