const test = require('ava');
const RuleTester = require('eslint-ava-rule-tester');
const path = require('path');

const plugin = require('../../eslint-plugin');

test('Compatibility with proxy plugin path', t => {
  t.notThrows(() => {
    // Be very careful when changing this! Moving the eslint plugin from '/eslint-plugin' will break compatibility with the proxy plugin
    require(path.join(__dirname, '..', '..', 'eslint-plugin'));
  });
});

const ruleTester = new RuleTester(test, {
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 6,
    ecmaFeatures: { classes: true, jsx: true },
    sourceType: 'module'
  }
});

const { messages } = plugin.rules.all.meta;
const errors = Object.keys(messages).reduce((accum, key) =>
  Object.assign(accum, { [key]: key })
);

const footer = 'export default A;';

// These all have 'footer' appended further down
const validCases = [
  // Only export statement
  '',

  // Empty propTypes
  'A.propTypes = {};',

  // No object literal in propTypes
  'A.propTypes = B.propTypes;',

  // Weird value for propTypes
  'A.propTypes = false;',

  // Empty propTypesMeta
  'A.propTypesMeta = {};',

  // No object literal
  'A.propTypesMeta;',

  // No object literal (class component)
  'class A { static propTypesMeta }',

  // Non-object propTypesMeta
  'A.propTypesMeta = false;',

  // No object literal in propTypes (class component)
  'class A { static propTypes = B.propTypes; }',

  // Invalid 'object' with meta type
  'A.propTypes = { b: PropTypes.object }; A.propTypesMeta = { b: "exclude" };',

  // Invalid 'object' with meta type (class component)
  'class A { static propTypes = { b: PropTypes.object }; static propTypesMeta = { b: "exclude" };}',

  // Invalid required 'object' with meta type
  'A.propTypes = { b: PropTypes.object.isRequired }; A.propTypesMeta = { b: "exclude" };',

  // Invalid required 'object' with meta type (class component)
  'class A { static propTypes = { b: PropTypes.object.isRequired }; static propTypesMeta = { b: "exclude" }; }',

  // Invalid 'array' with meta type
  'A.propTypes = { b: PropTypes.array }; A.propTypesMeta = { b: "exclude" };',

  // Invalid 'array' with meta type (class component)
  'class A { static propTypes = { b: PropTypes.array }; static propTypesMeta = { b: "exclude" }; }',

  // Invalid 'oneOfType' with meta type
  'A.propTypes = { b: PropTypes.oneOfType() }; A.propTypesMeta = { b: "exclude" };',

  // Invalid 'oneOfType' with meta type (class component)
  'class A { static propTypes = { b: PropTypes.oneOfType() }; static propTypesMeta = { b: "exclude" }; }',

  // Invalid function call with meta type
  'A.propTypes = { b: someFunc() }; A.propTypesMeta = { b: "exclude" };',

  // Invalid function call with meta type (class component)
  'class A { static propTypes = { b: someFunc() }; static propTypesMeta = { b: "exclude" }; }',

  // Valid meta type Array()
  'A.propTypesMeta = { b: Array(B) };',

  // Valid meta type Array() (class component)
  'class A { static propTypesMeta = { b: Array(B) }; }',

  // Valid meta type 'exclude'
  'A.propTypesMeta = { b: "exclude" };',

  // Valid meta type 'exclude' (class component)
  'class A { static propTypesMeta = { b: "exclude" }; }',

  // Valid meta type 'int'
  'A.propTypesMeta = { b: "int" };',

  // Valid meta type 'int' (class component)
  'class A { static propTypesMeta = { b: "int" }; }',

  // Valid meta type 'float'
  'A.propTypesMeta = { b: "float" };',

  // Valid meta type 'float' (class component)
  'class A { static propTypesMeta = { b: "float" }; }',

  // Object with nested meta
  'A.propTypes = { b: PropTypes.object }; A.propTypesMeta = { b: { c: Link } };',

  // Empty shape
  'A.propTypes = { b: PropTypes.shape() };',

  // Nested shape with bad prop and nested meta
  'A.propTypes = { b: PropTypes.shape({ c: PropTypes.object }) }; A.propTypesMeta = { b: { c: Link } };',

  // Reference to object literal in Object.keys
  'const obj = { c: "d" }; A.propTypes = { c: PropTypes.oneOf(Object.keys(obj)) };',

  // Reference to object literal in Object.values
  'const obj = { c: "d" }; A.propTypes = { c: PropTypes.oneOf(Object.values(obj)) };',

  // Reference to component in PropTypes.shape
  'A.propTypes = { b: PropTypes.shape(C.propTypes) };',

  // Reference to array literal in oneOf
  'const arr = [1,2]; A.propTypes = { c: PropTypes.oneOf(arr) };'
].map(code => code + footer);

// These all have 'footer' appended further down
const invalidCases = [
  // PropTypes.object
  ['A.propTypes = { b: PropTypes.object };', errors.object],

  // PropTypes.object (class component)
  ['class A { static propTypes = { b: PropTypes.object };}', errors.object],

  // PropTypes.array
  ['A.propTypes = { b: PropTypes.array };', errors.array],

  // PropTypes.array (class component)
  ['class A { static propTypes = { b: PropTypes.array }; }', errors.array],

  // PropTypes.object.isRequired
  ['A.propTypes = { b: PropTypes.object.isRequired };', errors.object],

  // PropTypes.object.isRequired (class component)
  [
    'class A { static propTypes = { b: PropTypes.object.isRequired }; }',
    errors.object
  ],

  // PropTypes.oneOfType
  ['A.propTypes = { b: PropTypes.oneOfType() };', errors.oneOfType],

  // PropTypes.oneOfType (class component)
  [
    'class A { static propTypes = { b: PropTypes.oneOfType() }; }',
    errors.oneOfType
  ],

  // Name collision
  ['A.propTypes = { a: PropTypes.string };', errors.propNameCollision],

  // Name collision (class component)
  [
    'class A { static propTypes = { a: PropTypes.string }; }',
    errors.propNameCollision
  ],

  // Invalid function call
  ['A.propTypes = { b: someFunc() };', errors.illegalFunctionCall],

  // Invalid function call (class component)
  [
    'class A { static propTypes = { b: someFunc() }; }',
    errors.illegalFunctionCall
  ],

  // Invalid identifier
  [
    'class A { static propTypes = { b: someIdentifier }; }',
    errors.illegalIdentifier
  ],

  // Nested without meta
  [
    'A.propTypes = { b: PropTypes.shape({ c: PropTypes.object }) };',
    errors.object
  ],

  // Typos in string literals
  ['A.propTypesMeta = { b: "exclud" };', errors.badStringLiteral],

  // Bad function call
  ['A.propTypesMeta = { b: Arr(B) };', errors.badFunctionCall],

  // Imported object in Object.keys
  [
    'import obj from "./obj"; A.propTypes = { c: PropTypes.oneOf(Object.keys(obj)) };',
    errors.importedObjectReference
  ],

  // Imported object in Object.values
  [
    'import obj from "./obj"; A.propTypes = { c: PropTypes.oneOf(Object.values(obj)) };',
    errors.importedObjectReference
  ],

  // Incomplete statement (should not make the plugin crash)
  [
    'const arr = [1,2]; A.propTypes = { c: PropTypes.oneOf(Object.values()) };',
    errors.missingObjectReference
  ],

  // Imported arrays in oneOf
  [
    'import arr from "./arr"; A.propTypes = { c: PropTypes.oneOf(arr) };',
    errors.importedArrayReference
  ]
]
  .map(([code, ...errors]) => [code + footer, ...errors])
  .concat([
    // Missing export
    ['const A = () => {};', errors.noExport],

    // Too many exports
    ['export { A, B };', errors.tooManyExports, errors.tooManyExports],

    // Too many exports
    [
      'export default A; export { B, C };',
      errors.tooManyExports,
      errors.tooManyExports,
      errors.tooManyExports
    ]
  ]);

// The eslint plugin will only run for .jsx files, so a filename is added for all tests
ruleTester.run('all', plugin.rules.all, {
  valid: validCases.map(code => ({ code, filename: 'a.jsx' })),
  invalid: invalidCases.map(([code, ...errors]) => ({
    code,
    filename: 'a.jsx',
    errors: errors.map(error => ({
      messageId: error
    }))
  }))
});

// Test non-jsx files
ruleTester.run('all', plugin.rules.all, {
  valid: [{ code: 'C.propTypes = { a: propTypes.object };', filename: 'a.js' }],
  invalid: []
});
