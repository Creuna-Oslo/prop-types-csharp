const generateClass = require('../lib');

const { components } = require('../fixtures/source-code');

generateClass({ sourceCode: components.funcComponent });
