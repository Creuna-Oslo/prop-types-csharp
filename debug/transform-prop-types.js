/* eslint-env node */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const transformPropTypes = require('../source/transforms/transform-prop-types');

const componentSource = fs.readFileSync(
  path.join(__dirname, '../test-components/component.jsx'),
  'utf-8'
);

try {
  console.log(transformPropTypes(componentSource, 'component'));
} catch (error) {
  console.log(error);
}
