const generate = require('@babel/generator').default;
const { parse } = require('@babel/parser');
const test = require('ava');

const expandReferencess = require('../source/transforms/expand-references');

test('Func component: array literal', t => {
  const syntaxTree = parse(
    'const array=[1,2];Component.propTypes={prop:oneOf(array)};'
  );
  expandReferencess({ syntaxTree, componentName: 'Component' });

  t.is(
    generate(syntaxTree, { minified: true }).code,
    'const array=[1,2];Component.propTypes={prop:oneOf([1,2])};'
  );
});

test('Func component: object keys', t => {
  const syntaxTree = parse(
    'const object={a:1,b:2};Component.propTypes={prop:oneOf(Object.keys(object))}'
  );
  expandReferencess({ syntaxTree, componentName: 'Component' });

  t.is(
    generate(syntaxTree, { minified: true }).code,
    'const object={a:1,b:2};Component.propTypes={prop:oneOf(["a","b"])};'
  );
});

test('Func component: object values', t => {
  const syntaxTree = parse(
    'const object={a:1,b:2};Component.propTypes={prop:oneOf(Object.values(object))}'
  );
  expandReferencess({ syntaxTree, componentName: 'Component' });

  t.is(
    generate(syntaxTree, { minified: true }).code,
    'const object={a:1,b:2};Component.propTypes={prop:oneOf([1,2])};'
  );
});

test('Func component: missing literal', t => {
  const syntaxTree = parse(
    'import array from ".";Component.propTypes={prop:oneOf(array)};',
    { sourceType: 'module' }
  );
  t.throws(() => {
    expandReferencess({ syntaxTree, componentName: 'Component' });
  });
});

test('Class component: array literal', t => {
  const syntaxTree = parse(
    'const array=[1,2];class Component{static propTypes={prop:oneOf(array)};}',
    { plugins: ['classProperties'] }
  );
  expandReferencess({ syntaxTree, componentName: 'Component' });

  t.is(
    generate(syntaxTree, { minified: true }).code,
    'const array=[1,2];class Component{static propTypes={prop:oneOf([1,2])}}'
  );
});

test('Class component: object keys', t => {
  const syntaxTree = parse(
    'const object={a:1,b:2};class Component{static propTypes={prop:oneOf(Object.keys(object))};}',
    { plugins: ['classProperties'] }
  );
  expandReferencess({ syntaxTree, componentName: 'Component' });

  t.is(
    generate(syntaxTree, { minified: true }).code,
    'const object={a:1,b:2};class Component{static propTypes={prop:oneOf(["a","b"])}}'
  );
});

test('Func component: object values', t => {
  const syntaxTree = parse(
    'const object={a:1,b:2};class Component{static propTypes={prop:oneOf(Object.values(object))}}',
    { plugins: ['classProperties'] }
  );
  expandReferencess({ syntaxTree, componentName: 'Component' });

  t.is(
    generate(syntaxTree, { minified: true }).code,
    'const object={a:1,b:2};class Component{static propTypes={prop:oneOf([1,2])}}'
  );
});

test('Class component: missing literal', t => {
  const syntaxTree = parse(
    'import array from ".";class Component{static propTypes={prop:oneOf(array)};}',
    { plugins: ['classProperties'], sourceType: 'module' }
  );
  t.throws(() => {
    expandReferencess({ syntaxTree, componentName: 'Component' });
  });
});
