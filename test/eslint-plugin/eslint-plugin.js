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
  parserOptions: {
    ecmaVersion: 2015,
    ecmaFeatures: { classes: true, jsx: true },
    sourceType: 'module'
  }
});

const { messages } = plugin.rules.all.meta;
const errors = Object.keys(messages).reduce((accum, key) =>
  Object.assign(accum, { [key]: key })
);

const footer = 'export default A;';

const validCases = [
  // Only export statement
  '',

  // No object literal in propTypes
  'A.propTypes = B.propTypes;',

  // Invalid 'object' with meta type
  'A.propTypes = { b: PropTypes.object }; A.propTypesMeta = { b: "exclude" };',

  // Invalid required 'object' with meta type
  'A.propTypes = { b: PropTypes.object.isRequired }; A.propTypesMeta = { b: "exclude" };',

  // Invalid 'array' with meta type
  'A.propTypes = { b: PropTypes.array }; A.propTypesMeta = { b: "exclude" };',

  // Invalid 'oneOfType' with meta type
  'A.propTypes = { b: PropTypes.oneOfType() }; A.propTypesMeta = { b: "exclude" };',

  // Invalid function call with meta type
  ['A.propTypes = { b: someFunc() }; A.propTypesMeta = { b: "exclude" };'],

  // Valid meta type Array()
  'A.propTypesMeta = { b: Array(B) };',

  // Valid meta type 'exclude'
  'A.propTypesMeta = { b: "exclude" };',

  // Valid meta type 'int'
  'A.propTypesMeta = { b: "int" };',

  // Valid meta type 'float'
  'A.propTypesMeta = { b: "float" };'
].map(code => code + footer);

const invalidCases = [
  // PropTypes.object
  ['A.propTypes = { b: PropTypes.object };' + footer, errors.object],

  // PropTypes.array
  ['A.propTypes = { b: PropTypes.array };' + footer, errors.array],

  // PropTypes.object.isRequired
  ['A.propTypes = { b: PropTypes.object.isRequired };' + footer, errors.object],

  // PropTypes.oneOfType
  ['A.propTypes = { b: PropTypes.oneOfType() };' + footer, errors.oneOfType],

  // Name collision
  ['A.propTypes = { a: PropTypes.string };' + footer, errors.propNameCollision],

  // Invalid function call
  ['A.propTypes = { b: someFunc() };' + footer, errors.illegalFunctionCall],

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
  ],

  // Typos in string literals
  ['A.propTypesMeta = { b: "exclud" };' + footer, errors.badStringLiteral],

  // Bad function call
  ['A.propTypesMeta = { b: Arr(B) };' + footer, errors.badFunctionCall]
];

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
