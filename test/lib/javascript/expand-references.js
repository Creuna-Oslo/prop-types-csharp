const generate = require('@babel/generator').default;
const { parse } = require('@babel/parser');
const test = require('ava');

const expandReferencess = require('../../../lib/parse/javascript/expand-references');

const template = (t, input, expected, propTypesMeta = {}) => {
  const syntaxTree = parse(input, { plugins: ['classProperties'] });
  expandReferencess({ syntaxTree, propTypesMeta, componentName: 'Component' });

  t.is(generate(syntaxTree, { minified: true }).code, expected);
};

const throwsTemplate = (t, input, errorMessage) => {
  const syntaxTree = parse(input, {
    sourceType: 'module',
    plugins: ['classProperties']
  });
  const error = t.throws(() => {
    expandReferencess({ syntaxTree, componentName: 'Component' });
  });
  t.is(error.message, errorMessage);
};

test(
  'Func component: inline literal',
  template,
  'Component.propTypes={prop:oneOf([1,2])};',
  'Component.propTypes={prop:oneOf([1,2])};'
);

test(
  'Func component: array literal',
  template,
  'const array=[1,2];Component.propTypes={prop:oneOf(array)};',
  'const array=[1,2];Component.propTypes={prop:oneOf([1,2])};'
);

test(
  'Func component: object keys',
  template,
  'const object={a:1,b:2};Component.propTypes={prop:oneOf(Object.keys(object))}',
  'const object={a:1,b:2};Component.propTypes={prop:oneOf(Object.keys({a:1,b:2}))};'
);

test(
  'Func component: object values',
  template,
  'const object={a:1,b:2};Component.propTypes={prop:oneOf(Object.values(object))}',
  'const object={a:1,b:2};Component.propTypes={prop:oneOf(Object.values({a:1,b:2}))};'
);

test(
  'Class component: inline literal',
  template,
  'class Component{static propTypes={prop:oneOf([1,2])};}',
  'class Component{static propTypes={prop:oneOf([1,2])}}'
);

test(
  'Class component: array literal',
  template,
  'const array=[1,2];class Component{static propTypes={prop:oneOf(array)};}',
  'const array=[1,2];class Component{static propTypes={prop:oneOf([1,2])}}'
);

test(
  'Class component: object keys',
  template,
  'const object={a:1,b:2};class Component{static propTypes={prop:oneOf(Object.keys(object))};}',
  'const object={a:1,b:2};class Component{static propTypes={prop:oneOf(Object.keys({a:1,b:2}))}}'
);

test(
  'Class component: object values',
  template,
  'const object={a:1,b:2};class Component{static propTypes={prop:oneOf(Object.values(object))}}',
  'const object={a:1,b:2};class Component{static propTypes={prop:oneOf(Object.values({a:1,b:2}))}}'
);

test(
  'Class component: throws on missing literal',
  throwsTemplate,
  'import array from ".";class Component{static propTypes={prop:oneOf(array)};}',
  "Couldn't resolve 'oneOf' value for prop 'prop'. Make sure that 'array' is defined in the above file and that it's not imported."
);

test(
  'Func component: throws on missing literal',
  throwsTemplate,
  'import array from ".";Component.propTypes={prop:oneOf(array)};',
  "Couldn't resolve 'oneOf' value for prop 'prop'. Make sure that 'array' is defined in the above file and that it's not imported."
);

test(
  'Throws on undefined literal',
  throwsTemplate,
  'Component.propTypes={prop:oneOf(array)};',
  "Couldn't resolve 'oneOf' value for prop 'prop'. Make sure that 'array' is defined in the above file and that it's not imported."
);

test(
  'Throws on empty oneOf',
  throwsTemplate,
  'Component.propTypes={prop:oneOf()};',
  "Missing value in 'oneOf' for prop 'prop'"
);

test(
  'Throws on empty Object.keys in oneOf',
  throwsTemplate,
  'Component.propTypes={prop:oneOf(Object.keys())}',
  "Missing value in 'oneOf' for prop 'prop'"
);

test(
  'Throws on missing object literal',
  throwsTemplate,
  'Component.propTypes={prop:oneOf(Object.keys(obj))}',
  "Couldn't resolve 'oneOf' value for prop 'prop'. Make sure that 'obj' is defined in the above file and that it's not imported."
);

test(
  'Throws on undefined object value',
  throwsTemplate,
  'let obj; Component.propTypes={prop:oneOf(Object.keys(obj))}',
  "Couldn't resolve 'oneOf' value for prop 'prop'. Make sure that 'obj' is defined in the above file and that it's not imported."
);
