const generate = require('@babel/generator').default;
const { parse } = require('@babel/parser');
const test = require('ava');

const createNewDefinitions = require('../lib/transforms/create-new-definitions');

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
  'Component={a:Component_A};Component_A={b:string};'
);

test(
  'Shape nested',
  template,
  'Component',
  'Component = { a: shape({ b: shape({ c: string }) }) };',
  'Component={a:Component_A};Component_A={b:Component_B};Component_B={c:string};'
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
  'Component={a:arrayOf(Component_AItem)};Component_AItem={b:string};'
);

test(
  'Shape isRequired',
  template,
  'Component',
  'Component = { a: shape({ b: string }).isRequired };',
  'Component={a:Component_A.isRequired};Component_A={b:string};'
);

test(
  'ArrayOf shape isRequired',
  template,
  'Component',
  'Component = { a: arrayOf(shape({ b: string })).isRequired };',
  'Component={a:arrayOf(Component_AItem).isRequired};Component_AItem={b:string};'
);
