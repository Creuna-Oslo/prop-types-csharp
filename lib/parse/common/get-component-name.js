const t = require('@babel/types');

const { match, get, Pipe } = require('kompis');

const multipleExportsError = new Error(
  `Couldn't get component name because of multiple exports.`
);

const handleVarDeclaration = n => {
  if (n.declarations.length > 1) throw multipleExportsError;
  return get('declarations[0].id.name')(n);
};

const getNameFromDeclaration = Pipe(
  get('declaration'),
  match(
    [t.isIdentifier, get('name')],
    [t.isClassDeclaration, get('id.name')],
    [t.isVariableDeclaration, handleVarDeclaration]
  )
);

// Gets component name from export declaration. Expects a File node
module.exports = function({ syntaxTree }) {
  const exportDeclarations = syntaxTree.program.body.filter(
    statement =>
      t.isExportDeclaration(statement) &&
      !t.isTSInterfaceDeclaration(statement.declaration) &&
      !t.isTSTypeAliasDeclaration(statement.declaration)
  );

  const defaultExport = exportDeclarations.find(t.isExportDefaultDeclaration);

  if (defaultExport) {
    return { componentName: getNameFromDeclaration(defaultExport) };
  }

  if (exportDeclarations.length > 1) {
    throw multipleExportsError;
  }

  const [declaration] = exportDeclarations;

  if (!declaration || !declaration.specifiers) {
    throw new Error(
      `Component name not found. Make sure that:
• your component is exported as an ES module
• the file has at most one named export or a default export`
    );
  }

  // An ExportDeclaration may have a 'declaration' property
  if (declaration.declaration) {
    return { componentName: getNameFromDeclaration(declaration) };
  }

  // It may also have a 'specifiers' property which holds a list of exports
  if (declaration.specifiers.length > 1) {
    throw multipleExportsError;
  }

  const [specifier] = declaration.specifiers;
  return { componentName: specifier.exported.name };
};
