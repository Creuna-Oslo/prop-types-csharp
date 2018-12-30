const { parse } = require('@babel/parser');
const test = require('ava');

const getComponentName = require('../../lib/parse/common/get-component-name');

const template = (t, input, expected) => {
  const syntaxTree = parse(input, { sourceType: 'module' });
  t.is(getComponentName({ syntaxTree }).componentName, expected);
};

const throwsTemplate = (t, input, errorMessage) => {
  const syntaxTree = parse(input, { sourceType: 'module' });
  const error = t.throws(() => {
    getComponentName({ syntaxTree });
  });

  t.is(errorMessage, error.message);
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

const componentNameNotFoundError = `Component name not found. Make sure that:
• your component is exported as an ES module
• the file has at most one named export or a default export`;

const multipleExportsError = `Couldn't get component name because of multiple exports.`;

test(
  'Throws on missing export',
  throwsTemplate,
  'const Component = () => {};',
  componentNameNotFoundError
);

test(
  'Throws on export all',
  throwsTemplate,
  'export * from "Component";',
  componentNameNotFoundError
);

test(
  'Throws on multiple named exports',
  throwsTemplate,
  'export { Component, OtherComponent };',
  multipleExportsError
);

test(
  'Throws on multiple named exports',
  throwsTemplate,
  'export const a = "a"; export { Component };',
  multipleExportsError
);
