const t = require('babel-types');

module.exports = ({ propTypesAST }) => {
  const className = propTypesAST.expression.left.name;
  const objectLiteral = propTypesAST.expression.right;

  // the 'right' property might also be a MemberExpression.
  if (!t.isObjectExpression(objectLiteral)) {
    return;
  }

  const nameCollision = objectLiteral.properties.find(
    property => property.key.name.toLowerCase() === className.toLowerCase()
  );

  if (nameCollision) {
    throw new Error(
      `Illegal prop name '${
        nameCollision.key.name
      }'. Prop names must be different from component name.`
    );
  }
};
