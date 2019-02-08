const test = require('ava');

const filterPaths = require('../../webpack-plugin/filter-paths');

const template = (t, paths, match, exclude, expected) => {
  t.deepEqual(expected, filterPaths(paths, match, exclude));
};

const unixPaths = [
  '/root/one/one.js',
  '/root/one/one.jsx',
  '/root/two/two.js',
  '/root/two/to.jsx',
  '/root/three/three.js',
  '/root/three/three.jsx',
  '/root/three/three.js',
  '/root/three/three.jsx'
];

// Single backslash
const posixPaths = unixPaths.map(path => path.replace(/\//g, '\\'));

// Double backslash
const morePosixPaths = unixPaths.map(path => path.replace(/\//g, '\\\\'));

const matchPatterns = [/.jsx$/];
const excludePatterns = ['/root/two', '\\root\\three', '\\\\root\\\\four'];

test('Unix paths', template, unixPaths, [/.jsx$/], excludePatterns, [
  '/root/one/one.jsx'
]);

test(
  'Posix paths (single backslash)',
  template,
  posixPaths,
  matchPatterns,
  excludePatterns,
  ['\\root\\one\\one.jsx']
);

test(
  'Posix paths (double backslash)',
  template,
  morePosixPaths,
  matchPatterns,
  excludePatterns,
  ['\\\\root\\\\one\\\\one.jsx']
);

test('Empty path', template, [undefined], matchPatterns, excludePatterns, []);

test('Without arguments', template, undefined, undefined, undefined, []);
