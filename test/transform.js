const fs = require('fs');
const path = require('path');
const test = require('ava');

const transformPropTypes = require('../source/transforms/transform-prop-types');

const funcComponentPath = path.join(
  __dirname,
  '../fixtures/func-component.jsx'
);
const funcComponentSource = fs.readFileSync(funcComponentPath, 'utf-8');

const classComponentPath = path.join(
  __dirname,
  '../fixtures/class-component.jsx'
);
const classComponentSource = fs.readFileSync(classComponentPath, 'utf-8');

test('Functional component', t => {
  const transformedSource = transformPropTypes({
    filePath: funcComponentPath,
    sourceCode: funcComponentSource
  });
  t.snapshot(transformedSource.code);
});

test('Class component', t => {
  const transformedSource = transformPropTypes({
    filePath: classComponentPath,
    sourceCode: classComponentSource
  });
  t.snapshot(transformedSource.code);
});
