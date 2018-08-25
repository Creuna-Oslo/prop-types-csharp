module.exports = ({ propTypesAST }) => {
  const className = propTypesAST.expression.left.name;
  const objectLiteral = propTypesAST.expression.right;

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
