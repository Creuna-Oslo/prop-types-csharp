const allowedMetaTypes = require('./allowed-meta-types');

module.exports = {
  array: 'Unsupported type "array". Replace with "arrayOf" or add meta type',
  badFunctionCall: `Expected one of [${Object.keys(
    allowedMetaTypes.functions
  )}] but got '{{value}}'.`,
  badStringLiteral: `Expected one of [${Object.keys(
    allowedMetaTypes.strings
  )}] but got '{{value}}'.`,
  noExport: `No export statement. Couldn't get component name.`,
  object: 'Unsupported type "object". Replace with "shape" or add meta type.',
  oneOfType: 'Unsupported type "oneOfType".',
  propNameCollision: `Prop can't have the same name as the component.`,
  tooManyExports: `Too many exports. Couldn't get component name.`
};
