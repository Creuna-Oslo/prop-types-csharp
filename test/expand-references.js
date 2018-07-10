const generate = require('@babel/generator').default;
const { parse } = require('@babel/parser');
const test = require('ava');

const expandReferencess = require('../source/transforms/expand-references');

const template = (t, input, expected) => {
  const syntaxTree = parse(input, { plugins: ['classProperties'] });
  expandReferencess({ syntaxTree, componentName: 'Component' });

  t.is(generate(syntaxTree, { minified: true }).code, expected);
};

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
  'const object={a:1,b:2};Component.propTypes={prop:oneOf(["a","b"])};'
);

test(
  'Func component: object values',
  template,
  'const object={a:1,b:2};Component.propTypes={prop:oneOf(Object.values(object))}',
  'const object={a:1,b:2};Component.propTypes={prop:oneOf([1,2])};'
);

test('Func component: missing literal', t => {
  const syntaxTree = parse(
    'import array from ".";Component.propTypes={prop:oneOf(array)};',
    { sourceType: 'module' }
  );
  t.throws(() => {
    expandReferencess({ syntaxTree, componentName: 'Component' });
  });
});

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
  'const object={a:1,b:2};class Component{static propTypes={prop:oneOf(["a","b"])}}'
);

test(
  'Func component: object values',
  template,
  'const object={a:1,b:2};class Component{static propTypes={prop:oneOf(Object.values(object))}}',
  'const object={a:1,b:2};class Component{static propTypes={prop:oneOf([1,2])}}'
);

test('Class component: missing literal', t => {
  const syntaxTree = parse(
    'import array from ".";class Component{static propTypes={prop:oneOf(array)};}',
    { plugins: ['classProperties'], sourceType: 'module' }
  );
  t.throws(() => {
    expandReferencess({ syntaxTree, componentName: 'Component' });
  });
});
