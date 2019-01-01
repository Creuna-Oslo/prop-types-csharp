const { parse } = require('@babel/parser');
const test = require('ava');
const traverse = require('@babel/traverse').default;

const typeNodeName = require('../../../lib/parse/typescript/type-node-name');

const template = (t, input, expected) => {
  const ast = parse(input, {
    plugins: ['typescript']
  });

  traverse(ast, {
    TSTypeAliasDeclaration: path => {
      t.is(expected, typeNodeName(path.node.typeAnnotation));
      t.end();
    }
  });
};

test.cb('Object', template, 'type A = object;', 'object');
test.cb('Any', template, 'type A = any;', 'any');
test.cb('Never', template, 'type A = never;', 'never');
test.cb('Void', template, 'type A = void;', 'void');
test.cb('literal', template, 'type A = "some-string";', 'literal type');
test.cb('Union', template, 'type A = number | string;', 'union type');
test.cb(
  'Intersection',
  template,
  'type A = number & string;',
  'intersection type'
);
