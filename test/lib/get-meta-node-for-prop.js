const { parse } = require('@babel/parser');
const bt = require('@babel/types');
const test = require('ava');
const traverse = require('@babel/traverse').default;

const getMetaNodeForProp = require('../../lib/utils/get-meta-node-for-prop');

test('Resolves meta for flat propTypes', t => {
  const syntaxTree = parse(`
A.propTypes = {
  b: array
};
  `);
  const expectedMeta = bt.arrayExpression([bt.identifier('Link')]);
  const propTypesMeta = {
    b: expectedMeta
  };
  traverse(syntaxTree, {
    ObjectProperty(path) {
      const meta = getMetaNodeForProp({ path, propTypesMeta });
      t.deepEqual(expectedMeta, meta);
    }
  });
});

test('Resolves meta for nested propTypes', t => {
  const syntaxTree = parse(`
A.propTypes = {
  b: {
    c: string
  }
};
  `);
  const expectedInner = bt.identifier('string');
  const expectedOuter = { c: expectedInner };
  const propTypesMeta = {
    b: expectedOuter
  };

  // Since traversal will hit an ObjectProperty node twice, we need two expected results, and since we're going to pop the array the first encountered result goes last in the array.
  const expecteds = [expectedInner, expectedOuter];

  traverse(syntaxTree, {
    ObjectProperty(path) {
      const meta = getMetaNodeForProp({ path, propTypesMeta });
      t.deepEqual(expecteds.pop(), meta);
    }
  });
});
