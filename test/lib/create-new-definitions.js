const generate = require('@babel/generator').default;
const { parse } = require('@babel/parser');
const test = require('ava');

const createNewDefinitions = require('../../lib/transforms/create-new-definitions');

const template = (t, input, expected) => {
  const syntaxTree = parse(input);
  createNewDefinitions({ syntaxTree });

  t.is(expected, generate(syntaxTree, { minified: true }).code);
};

test(
  'Shape simple',
  template,
  'Component = { a: { b: string } };',
  'Component={a:Component_A};Component_A={b:string};'
);

test(
  'Shape nested',
  template,
  'Component = { a: { b: { c: string } } };',
  'Component={a:Component_A};Component_A={b:Component_A_B};Component_A_B={c:string};'
);

test(
  'Array simple',
  template,
  'Component = { a: [string] };',
  'Component={a:[string]};'
);

test(
  'Array nested',
  template,
  'Component = { a: [[[string]]] };',
  'Component={a:[[[string]]]};'
);

test(
  'Array of object',
  template,
  'Component = { a: [{ b: string }] };',
  'Component={a:[Component_AItem]};Component_AItem={b:string};'
);

test(
  'Shape isRequired',
  template,
  'Component = { a: { b: string }.isRequired };',
  'Component={a:Component_A.isRequired};Component_A={b:string};'
);

test(
  'Array of object isRequired',
  template,
  'Component = { a: [{ b: string }].isRequired };',
  'Component={a:[Component_AItem].isRequired};Component_AItem={b:string};'
);

test(
  'Enum numbers',
  template,
  'Component = { a: [1,2,3] };',
  'Component={a:Component_A};Component_A=[1,2,3];'
);

test(
  'Enum strings',
  template,
  'Component = { a: ["value-1", "value-2"] };',
  'Component={a:Component_A};Component_A=["value-1","value-2"];'
);
