// const generate = require('@babel/generator').default;
const assert = require('assert');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const createDefinitions = require('./transforms/create-definitions');
const expandReferences = require('./transforms/expand-references');
const getComponentName = require('./utils/get-component-name');
const getMeta = require('./utils/get-meta');
const getPropTypes = require('./utils/get-prop-types');
const getPropTypesIdentifierName = require('./utils/get-prop-types-identifier-name');
const stripPropTypesIdentifier = require('./utils/strip-prop-types-identifier');
const stringify = require('./stringify');
const transformPropTypes = require('./transforms/transform-prop-types');
const validatePropNames = require('./utils/validate-prop-names');

const parseTree = require('./utils/parse-tree');

module.exports = function({ baseClass, indent, namespace, sourceCode }) {
  assert(sourceCode, 'No source code provided');

  const syntaxTree = parse(sourceCode, {
    plugins: ['jsx', 'classProperties'],
    sourceType: 'module'
  });

  const { componentName } = getComponentName({ syntaxTree });
  const { propTypesMeta } = getMeta({ syntaxTree });

  const { propTypesIdentifierName } = getPropTypesIdentifierName({
    syntaxTree
  });

  stripPropTypesIdentifier({ propTypesIdentifierName, syntaxTree });

  // Expand references to arrays and objects in 'oneOf'
  expandReferences({ componentName, propTypesMeta, syntaxTree });

  // Extract the propTypes part of the syntax tree
  const { propTypesAST } = getPropTypes({
    componentName,
    syntaxTree
  });

  // getPropTypes returns an Expression node, which contains an AssignmentExpression node, which has a 'right' property which is where the propType definitions live. The only legal values for the 'right' node is an ObjectExpression (object literal) or a MemberExpression that looks like this: 'SomeComponent.propTypes'.
  const propTypesValue = propTypesAST.expression.right;

  if (
    !t.isObjectExpression(propTypesValue) &&
    !t.isMemberExpression(propTypesValue)
  ) {
    return {};
  }

  // Exit if the propTypes definition is a MemberExpression but is not a reference to another component's propTypes.
  if (
    t.isMemberExpression(propTypesValue) &&
    !t.isIdentifier(propTypesValue.property, { name: 'propTypes' })
  ) {
    return;
  }

  // Replace Syntax tree representing the component with a tree only representing the propTypes. Sadly, I found no way of doing this without mutating the exising tree because generating a new program node will require a parentPath and a scope and who knows what they are.
  traverse(syntaxTree, {
    Program(path) {
      path.replaceWith(t.program([propTypesAST]));
      path.stop();
    }
  });

  const propTypes = parseTree(syntaxTree, propTypesMeta);

  validatePropNames(propTypes, componentName);

  // Strip client-only types, apply meta types and strip 'PropTypes' prefix from types
  const transformedPropTypes = transformPropTypes(propTypes, propTypesMeta);

  const definitions = createDefinitions(transformedPropTypes, componentName);

  const code = stringify({
    baseClass,
    componentName,
    definitions,
    indent,
    namespace
  });

  return { componentName, code };
};
