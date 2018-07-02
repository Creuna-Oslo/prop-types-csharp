const traverse = require('@babel/traverse').default;
const t = require('babel-types');

module.exports = function(syntaxTree) {
  let componentName;

  traverse(syntaxTree, {
    // Get PropTypes variable name from import statement.
    ExportDeclaration(path) {
      if (path.isExportNamedDeclaration()) {
        if (path.node.specifiers.length > 1) {
          throw new Error(
            `Couldn't get component name because of multiple exports.`
          );
        }

        componentName = path.node.specifiers[0].exported.name;
        path.stop();
        return;
      }

      if (path.isExportDefaultDeclaration()) {
        const { declaration } = path.node;

        if (
          !t.isIdentifier(declaration) &&
          !t.isClassDeclaration(declaration)
        ) {
          throw new Error(
            `Couldn't get component name because export is a ${
              declaration.type
            }.`
          );
        }

        switch (path.node.declaration.type) {
          case 'Identifier':
            componentName = declaration.name;
            path.stop();
            return;
          case 'ClassDeclaration':
            componentName = declaration.id.name;
            path.stop();
            return;
        }
      }
    }
  });

  if (componentName) {
    return { componentName };
  }

  throw new Error('Component name not found');
};
