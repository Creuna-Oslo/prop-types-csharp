const t = require('@babel/types');

const getFunctionName = require('../common/get-function-name');
const isMemberExpression = require('../../utils/is-member-expression');

module.exports = callExpression => {
  if (!isMemberExpression('Object', 'assign')(callExpression.callee)) {
    throw new Error(
      `Unsupported function '${getFunctionName(callExpression)}'.`
    );
  }

  const superComponent = callExpression.arguments.find(t.isMemberExpression);
  const propTypes = callExpression.arguments.find(
    node => t.isObjectExpression(node) && node.properties.length
  );

  if (!propTypes && !superComponent) {
    throw new Error("Couldn't find any propTypes value");
  }

  return { superClass: superComponent.object.name, propTypes };
};
