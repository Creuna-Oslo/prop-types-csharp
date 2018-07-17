const generate = require('@babel/generator').default;
const { parse } = require('@babel/parser');
const test = require('ava');

const createNewDefinitions = require('../source/transforms/create-new-definitions');

const template = (t, input, expected) => {
  const syntaxTree = parse(input);
  createNewDefinitions({ syntaxTree });

  t.is(generate(syntaxTree, { minified: true }).code, expected);
};

test(
  'Shape simple',
  template,
  'Component = { a: shape({ b: string }) };',
  'Component={a:A};A={b:string};'
);

test(
  'Shape nested',
  template,
  'Component = { a: shape({ b: shape({ c: string }) }) };',
  'Component={a:A};A={b:B};B={c:string};'
);

test(
  'ArrayOf simple',
  template,
  'Component = { a: arrayOf(string) };',
  'Component={a:arrayOf(string)};'
);

test(
  'ArrayOf shape',
  template,
  'Component = { a: arrayOf(shape({ b: string })) };',
  'Component={a:arrayOf(AItem)};AItem={b:string};'
);

test(
  'Shape isRequired',
  template,
  'Component = { a: shape({ b: string }).isRequired };',
  'Component={a:A.isRequired};A={b:string};'
);

test(
  'ArrayOf shape isRequired',
  template,
  'Component = { a: arrayOf(shape({ b: string })).isRequired };',
  'Component={a:arrayOf(AItem).isRequired};AItem={b:string};'
);
