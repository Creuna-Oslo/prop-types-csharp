const { parse } = require('@babel/parser');
const test = require('ava');

const parseAST = require('../../lib/parse/javascript/parse-ast');

const template = (t, input, propTypeMeta, expected) => {
  const ast = parse(input);

  t.deepEqual(expected, parseAST(ast, propTypeMeta));
};

const throwsTemplate = (t, input, errorMessage) => {
  const ast = parse(input);
  const error = t.throws(() => {
    parseAST(ast);
  });

  t.is(errorMessage, error.message);
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
  'oneOf Object.keys',
  template,
  `Component.propTypes = { a: oneOf(Object.keys({a:'b',c:'d'})) }`,
  {},
  { a: { type: 'oneOf', argument: ['a', 'c'] } }
);

test(
  'oneOf Object.values',
  template,
  `Component.propTypes = { a: oneOf(Object.values({a:'b',c:'d'})) }`,
  {},
  {
    a: {
      type: 'oneOf',
      argument: [{ key: 'a', value: 'b' }, { key: 'c', value: 'd' }]
    }
  }
);

test(
  'Throws on unsupported Object method',
  throwsTemplate,
  'Component.propTypes={prop:oneOf(Object.entries({a:"b"}))}',
  "Unsupported method 'Object.entries'."
);

test(
  'Throws on unsupported Object method',
  throwsTemplate,
  'Component.propTypes={prop:oneOf(Object.entries({a:"b"}))}',
  "Unsupported method 'Object.entries'."
);

test("Doesn't throw on Object method call without arguments", t => {
  const ast = parse(`Component.propTypes = { a: oneOf(Object.values()) };`);

  t.notThrows(() => {
    parseAST(ast);
  });
});

test("Doesn't throw on object without entries", t => {
  const ast = parse(`Component.propTypes = { a: oneOf(Object.values({})) };`);

  t.notThrows(() => {
    parseAST(ast);
  });
});

test(
  'Invalid oneOf value',
  throwsTemplate,
  `Component.propTypes = { a: oneOf([true, false]) };`,
  'Unsupported BooleanLiteral in PropTypes.oneOf'
);

test(
  'oneOf required',
  template,
  `Component.propTypes = { a: oneOf([1]).isRequired }`,
  {},
  { a: { type: 'oneOf', argument: [1], isRequired: true } }
);

test(
  'oneOfType with exclude',
  template,
  `Component.propTypes = { a: oneOf([string, number]) };`,
  { a: { type: 'exclude' } },
  {}
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
  'exact',
  template,
  `Component.propTypes = { a: exact({ b: exact({ c: string })}) }`,
  {},
  {
    a: {
      type: 'exact',
      argument: { b: { type: 'exact', argument: { c: { type: 'string' } } } }
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

test(
  'Invalid function call',
  throwsTemplate,
  'Component.propTypes = { a: someFunc() };',
  "Invalid function call 'someFunc'"
);

test('Invalid function call with exclude', t => {
  const ast = parse(`Component.propTypes = { a: someFunc() };`);
  const meta = { a: { type: 'exclude' } };

  t.notThrows(() => {
    parseAST(ast, meta);
  });
});

test('Invalid function call and object method with exclude', t => {
  const ast = parse(
    `Component.propTypes = { a: someFunc(Object.entries({a:1})) };`
  );
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

// To make sure no shenanigans happen when props are called 'type'
test(
  'Prop named "type"',
  template,
  `Component.propTypes = { type: (shape({ b: type })) }`,
  {},
  {
    type: { type: 'shape', argument: { b: { type: 'type' } } }
  }
);
