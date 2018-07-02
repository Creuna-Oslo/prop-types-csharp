/* eslint-env node */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const transformPropTypes = require('../source/transforms/transform-prop-types');

const componentPath = path.join(__dirname, '../fixtures/func-component.jsx');
const componentSource = fs.readFileSync(componentPath, 'utf-8');

try {
  console.log(transformPropTypes(componentSource, componentPath).code);
} catch (error) {
  console.log(error);
}
