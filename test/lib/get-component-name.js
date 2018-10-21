const { parse } = require('@babel/parser');
const test = require('ava');

const getComponentName = require('../../lib/utils/get-component-name');

const template = (t, input, expected) => {
  const syntaxTree = parse(input, { sourceType: 'module' });
  t.is(getComponentName({ syntaxTree }).componentName, expected);
};

const throwsTemplate = (t, input) => {
  const syntaxTree = parse(input, { sourceType: 'module' });
  t.throws(() => {
    getComponentName({ syntaxTree });
  });
};

test(
  'Export default',
  template,
  'export default class Component {};',
  'Component'
);

test(
  'Export default (end of file)',
  template,
  'export default Component;',
  'Component'
);

test('Named export', template, 'export class Component {};', 'Component');

test(
  'With variable exports',
  template,
  'export const a = "haha"; export default Component;',
  'Component'
);

test(
  'Named export (end of file)',
  template,
  'export { Component };',
  'Component'
);

test(
  'Named and default export',
  template,
  'export { SomeComponent }; export default Component;',
  'Component'
);

test('Throws on missing export', throwsTemplate, 'const Component = () => {};');

test('Throws on export all', throwsTemplate, 'export * from "Component";');

test(
  'Throws on multiple named exports',
  throwsTemplate,
  'export { Component, OtherComponent };'
);

test(
  'Throws on multiple named exports',
  throwsTemplate,
  'export const a = "a"; export { Component };'
);
