const generate = require('@babel/generator').default;
const { parse } = require('@babel/parser');
const test = require('ava');

const createNewDefinitions = require('../source/transforms/create-new-definitions');

const template = (t, componentName, input, expected) => {
  const syntaxTree = parse(input);
  createNewDefinitions({ componentName, syntaxTree });

  t.is(generate(syntaxTree, { minified: true }).code, expected);
};

test(
  'Shape simple',
  template,
  'Component',
  'Component = { a: shape({ b: string }) };',
  'Component={a:ComponentA};ComponentA={b:string};'
);

test(
  'Shape nested',
  template,
  'Component',
  'Component = { a: shape({ b: shape({ c: string }) }) };',
  'Component={a:ComponentA};ComponentA={b:ComponentB};ComponentB={c:string};'
);

test(
  'ArrayOf simple',
  template,
  'Component',
  'Component = { a: arrayOf(string) };',
  'Component={a:arrayOf(string)};'
);

test(
  'ArrayOf shape',
  template,
  'Component',
  'Component = { a: arrayOf(shape({ b: string })) };',
  'Component={a:arrayOf(ComponentAItem)};ComponentAItem={b:string};'
);

test(
  'Shape isRequired',
  template,
  'Component',
  'Component = { a: shape({ b: string }).isRequired };',
  'Component={a:ComponentA.isRequired};ComponentA={b:string};'
);

test(
  'ArrayOf shape isRequired',
  template,
  'Component',
  'Component = { a: arrayOf(shape({ b: string })).isRequired };',
  'Component={a:arrayOf(ComponentAItem).isRequired};ComponentAItem={b:string};'
);
