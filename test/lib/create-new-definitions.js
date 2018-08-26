const generate = require('@babel/generator').default;
const { parse } = require('@babel/parser');
const test = require('ava');

const createNewDefinitions = require('../../lib/transforms/create-new-definitions');

const template = (t, componentName, input, expected) => {
  const syntaxTree = parse(input);
  createNewDefinitions({ componentName, syntaxTree });

  t.is(expected, generate(syntaxTree, { minified: true }).code);
};

test(
  'Shape simple',
  template,
  'Component',
  'Component = { a: { b: string } };',
  'Component={a:Component_A};Component_A={b:string};'
);

test(
  'Shape nested',
  template,
  'Component',
  'Component = { a: { b: { c: string } } };',
  'Component={a:Component_A};Component_A={b:Component_B};Component_B={c:string};'
);

test(
  'Array simple',
  template,
  'Component',
  'Component = { a: [string] };',
  'Component={a:[string]};'
);

test(
  'Array nested',
  template,
  'Component',
  'Component = { a: [[[string]]] };',
  'Component={a:[[[string]]]};'
);

test(
  'Array of object',
  template,
  'Component',
  'Component = { a: [{ b: string }] };',
  'Component={a:[Component_AItem]};Component_AItem={b:string};'
);

test(
  'Shape isRequired',
  template,
  'Component',
  'Component = { a: { b: string }.isRequired };',
  'Component={a:Component_A.isRequired};Component_A={b:string};'
);

test(
  'Array of object isRequired',
  template,
  'Component',
  'Component = { a: [{ b: string }].isRequired };',
  'Component={a:[Component_AItem].isRequired};Component_AItem={b:string};'
);

test(
  'Enum numbers',
  template,
  'Component',
  'Component = { a: [1,2,3] };',
  'Component={a:Component_A};Component_A=[1,2,3];'
);

test(
  'Enum strings',
  template,
  'Component',
  'Component = { a: ["value-1", "value-2"] };',
  'Component={a:Component_A};Component_A=["value-1","value-2"];'
);
