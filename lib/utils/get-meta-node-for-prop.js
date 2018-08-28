const t = require('babel-types');

// Expects an ObjectProperty NodePath. Resolves a nested propTypesMeta property by upward traversal of propTypes tree. Given the following propTypes:
// A.propTypes = { b: { c: string } }
// If 'path' is the 'b' node of this tree, '{ c: string }' will be returned. If 'path' is 'c', 'string' is returned.
const getMetaNodeForProp = ({
  path,
  propNames = [path.node.key.name],
  propTypesMeta
}) => {
  if (!propTypesMeta) {
    return;
  }

  // Check if the current prop node lives within an object literal
  const objectPropertyParent = path.findParent(parent =>
    t.isObjectProperty(parent)
  );

  // If the current prop node lives within an object literal, do the whole thing again recursively to see if this node's parent is also an object literal.
  if (objectPropertyParent) {
    return getMetaNodeForProp({
      path: objectPropertyParent,
      propNames: propNames.concat(objectPropertyParent.node.key.name),
      propTypesMeta
    });
  }

  // When an ObjectProperty parent wasn't found, we've reached the top of the object hierarchy. 'propNames' now contains a list of propNames we need to access the nested propTypesMeta property.
  // If propNames = ['prop', 'anotherProp'], propTypesMeta.anotherProp.prop will be returned. Since traversal is going upward, we need to reverse the array of propNames to get the correct 'selector'.
  return propNames
    .reverse()
    .reduce((accum, propName) => accum && accum[propName], propTypesMeta);
};

module.exports = getMetaNodeForProp;
